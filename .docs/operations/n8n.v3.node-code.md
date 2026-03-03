# n8n Scorecard v3 — Node Code Reference

All code below is ready to paste into the corresponding n8n Code nodes.
Back up the current workflow JSON **first** (Settings → Export).

---

## 1. Edit Fields (Set node)

Add these assignments (leave existing ones, update where noted):

| Field | Value | Change |
|-------|-------|--------|
| `assessment_id` | `humtech_v3` | **changed** from `humtech_v2` |
| `more_info_q` | `={{ $json.body.freeText['q16_additional_notes'] }}` | **changed** key name |
| `numericAnswers` | `={{ $json.body.numericAnswers }}` | **NEW** — type: object |
| `qualification` | `={{ $json.body.qualification }}` | **NEW** — type: object |
| `assessment_version` | `={{ $json.body.assessment_version }}` | **NEW** — type: string |

Keep `includeOtherFields: true` so everything else passes through.

---

## 2. Question Scoring / Pillar Weight (Code node)

**What changed:** q4_show_rate is now numeric (0–100%). When `rawAnswers.q4_show_rate === "NUMERIC"`, read the exact percentage from `numericAnswers` and convert to a 0–5 score. Fallback "F" still scores 0. Updated informative pass-through for new question IDs.

```javascript
/**
 * HumTech Score Assessment v3
 *
 * Inputs:
 *   $json.rawAnswers      -> { qid: "A"|"B"|...|"NUMERIC" }
 *   $json.numericAnswers   -> { qid: { value: number|null, isFallback: boolean } }
 *   $json.freeText         -> { q16_additional_notes: string }
 *
 * Outputs:
 *   scoring.radar    -> 5 pillars (0–10)
 *   scoring.pillars  -> same values
 *   scoring.overall  -> score10, percent, maturityBand
 *   scoring.informative -> unscored question data
 */

const raw = $json.rawAnswers || {};
const numericAnswers = $json.numericAnswers || {};
const freeText = $json.freeText || {};

// ---------------------------
// 1) Question scoring (0–5)
// ---------------------------
const SCORE_0_TO_5 = {
  q1_engagement_method:           { A: 5, B: 4, C: 2, D: 3, E: 0 },
  q2_response_time:               { A: 5, B: 4, C: 3, D: 2, E: 0 },
  q3_247_booking:                 { A: 5, B: 0 },
  // q4_show_rate handled separately (numeric)
  q5_repetitive_manual_processes: { A: 5, B: 4, C: 3, D: 2, E: 0 },
  q6_issue_detection:             { A: 2, B: 3, C: 4, D: 5 },
  q7_metric_tracking:             { A: 5, B: 4, C: 3, D: 2 },
  q8_non_revenue_time:            { A: 5, B: 4, C: 3, D: 2, E: 0 },
  q11_documents_and_signatures:   { A: 5, B: 4, C: 0, D: 0, E: 0 },
  q12_current_situation:          { A: 5, B: 3, C: 1 },
};

// ---------------------------
// 2) Pillars
// ---------------------------
const PILLARS = [
  "leadEngagementSpeed",
  "appointmentReliabilityConversion",
  "operationalFocusTimeEfficiency",
  "systemsAutomationMaturity",
  "revenueProtectionLeakageControl"
];

// ---------------------------
// 3) Question → pillar weights
// ---------------------------
const QUESTION_WEIGHTS = {
  q1_engagement_method: {
    leadEngagementSpeed: 0.6,
    revenueProtectionLeakageControl: 0.4
  },
  q2_response_time: {
    leadEngagementSpeed: 0.7,
    revenueProtectionLeakageControl: 0.3
  },
  q3_247_booking: {
    leadEngagementSpeed: 0.4,
    systemsAutomationMaturity: 0.6
  },
  q4_show_rate: {
    appointmentReliabilityConversion: 0.6,
    revenueProtectionLeakageControl: 0.4
  },
  q5_repetitive_manual_processes: {
    systemsAutomationMaturity: 1.0
  },
  q6_issue_detection: {
    systemsAutomationMaturity: 0.6,
    revenueProtectionLeakageControl: 0.4
  },
  q7_metric_tracking: {
    operationalFocusTimeEfficiency: 1.0
  },
  q8_non_revenue_time: {
    operationalFocusTimeEfficiency: 0.6,
    revenueProtectionLeakageControl: 0.4
  },
  q11_documents_and_signatures: {
    operationalFocusTimeEfficiency: 0.3,
    systemsAutomationMaturity: 0.7
  },
  q12_current_situation: {
    systemsAutomationMaturity: 0.6,
    revenueProtectionLeakageControl: 0.4
  }
};

// ---------------------------
// Helpers
// ---------------------------
function scoreQuestion0to5(qid, answerId) {
  // Special handling for q4_show_rate (now numeric)
  if (qid === "q4_show_rate") {
    if (answerId === "NUMERIC") {
      const entry = numericAnswers.q4_show_rate;
      if (entry && entry.value != null && !entry.isFallback) {
        // Linear mapping: 0% → 0, 100% → 5
        return Math.max(0, Math.min(5, (entry.value / 100) * 5));
      }
      return 0;
    }
    if (answerId === "F") return 0; // fallback
    // Legacy radio fallback (shouldn't happen in v3)
    const legacyMap = { A: 2, B: 3, C: 4, D: 5, E: 0 };
    return legacyMap[answerId] ?? 0;
  }

  const map = SCORE_0_TO_5[qid];
  if (!map) return 0;
  const s = map[answerId];
  return typeof s === "number" ? s : 0;
}

function to0to10(score0to5) {
  return (score0to5 / 5) * 10;
}

function clamp0to10(v) {
  return Math.max(0, Math.min(10, v));
}

// ---------------------------
// 4) Compute pillar scores
// ---------------------------
const pillarTotals = Object.fromEntries(PILLARS.map(p => [p, 0]));
const pillarWeights = Object.fromEntries(PILLARS.map(p => [p, 0]));
const missingQuestions = [];

for (const qid of Object.keys(QUESTION_WEIGHTS)) {
  const ans = raw[qid];
  if (!ans) missingQuestions.push(qid);

  const s0to5 = scoreQuestion0to5(qid, ans);
  const s0to10 = to0to10(s0to5);

  const weights = QUESTION_WEIGHTS[qid];
  for (const [pillar, w] of Object.entries(weights)) {
    pillarTotals[pillar] += s0to10 * w;
    pillarWeights[pillar] += w;
  }
}

const pillars = {};
for (const pillar of PILLARS) {
  const denom = pillarWeights[pillar] || 0;
  const rawScore = denom ? pillarTotals[pillar] / denom : 0;
  pillars[pillar] = clamp0to10(Math.round(rawScore * 10) / 10);
}

const radar = { ...pillars };

// ---------------------------
// 5) Overall score
// ---------------------------
const PILLAR_IMPORTANCE = {
  leadEngagementSpeed: 0.22,
  appointmentReliabilityConversion: 0.22,
  operationalFocusTimeEfficiency: 0.22,
  systemsAutomationMaturity: 0.22,
  revenueProtectionLeakageControl: 0.12
};

let overallNumerator = 0;
let overallDenom = 0;
for (const p of PILLARS) {
  const w = PILLAR_IMPORTANCE[p] || 0;
  overallNumerator += (pillars[p] || 0) * w;
  overallDenom += w;
}
const overallScore10 = overallDenom ? overallNumerator / overallDenom : 0;
const overallScore10Rounded = clamp0to10(Math.round(overallScore10 * 10) / 10);
const overallPercent = Math.round((overallScore10Rounded / 10) * 100);

function bandFor(score10) {
  if (score10 < 5.0) return "Constrained";
  if (score10 < 7.0) return "Emerging";
  if (score10 < 9.0) return "Developing/Advanced";
  return "Optimised";
}
const maturityBand = bandFor(overallScore10Rounded);

// ---------------------------
// 6) Informative pass-through (v3 question IDs)
// ---------------------------
const informative = {
  q13DesiredOutcome: (() => {
    const v = raw.q13_desired_outcome;
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v) return [v];
    return null;
  })(),
  q14AiBarriers: (() => {
    const v = raw.q14_ai_barriers;
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v) return [v];
    return null;
  })(),
  q16AdditionalNotes: freeText.q16_additional_notes || null,
  // New marketing questions
  qMarketingChannels: (() => {
    const v = raw.q_marketing_channels;
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v) return [v];
    return null;
  })(),
  qMarketingSpend: raw.q_marketing_spend || null,
  qCroSpecialist: raw.q_cro_specialist || null,
};

// ---------------------------
// 7) Return
// ---------------------------
return [{
  json: {
    ...$json,
    scoring: {
      radar,
      pillars,
      overall: {
        score10: overallScore10Rounded,
        percent: overallPercent,
        maturityBand
      },
      informative,
      qa: { missingQuestions }
    }
  }
}];
```

---

## 3. Revenue Waterfall (Code node)

**Position:** After Question Scoring, before Banding. (Or after Banding — order doesn't matter as long as it reads `$json.numericAnswers`.)

**What changed:** Complete rewrite. No ghost rate. Uses exact numeric values from `numericAnswers`. 3-stage cascade. Annual figures (×12). Fallback to industry defaults with flag.

```javascript
/**
 * Revenue Waterfall v3 — 3-Stage Leads-Based Cascade
 *
 * No ghost rate. Every number comes from the lead's own answers.
 * When "unsure" fallback selected, uses industry defaults + flags it.
 *
 * Inputs:
 *   $json.numericAnswers  -> { qid: { value: number|null, isFallback: boolean } }
 *   $json.rawAnswers      -> for gross margin lookup
 *   $json.qualification   -> pass-through from form
 *
 * Outputs:
 *   revenueWaterfall.*    -> monthly + annual figures, funnel stages, summary
 *   qualification.*       -> enriched with waterfall results
 */

const numericAnswers = $json.numericAnswers || {};
const rawAnswers = $json.rawAnswers || {};

// ── Industry defaults (used when "unsure" fallback selected) ──
const DEFAULTS = {
  leadVolume: 125,
  dealValue: 1250,
  bookingRate: 50,
  attendanceRate: 70,
  transactionRate: 55
};

// ── Extract values: exact when provided, default when fallback ──
function getVal(qid, defaultVal) {
  const entry = numericAnswers[qid];
  if (entry && !entry.isFallback && entry.value != null) {
    return { value: entry.value, isFallback: false };
  }
  return { value: defaultVal, isFallback: true };
}

const leadVolume      = getVal("q_lead_volume",     DEFAULTS.leadVolume);
const dealValue       = getVal("q_deal_value",       DEFAULTS.dealValue);
const bookingRate     = getVal("q4_show_rate",       DEFAULTS.bookingRate);
const attendanceRate  = getVal("q_attendance_rate",  DEFAULTS.attendanceRate);
const transactionRate = getVal("q_transaction_rate", DEFAULTS.transactionRate);

const anyFallback =
  leadVolume.isFallback || dealValue.isFallback ||
  bookingRate.isFallback || attendanceRate.isFallback ||
  transactionRate.isFallback;

// ── 3-Stage Waterfall (monthly) ──
const totalLeads    = leadVolume.value;
const avgDealValue  = dealValue.value;
const bookPct       = bookingRate.value / 100;
const showPct       = attendanceRate.value / 100;
const convertPct    = transactionRate.value / 100;

const leadsThatBook    = totalLeads * bookPct;
const leadsThatShow    = leadsThatBook * showPct;
const leadsThatConvert = leadsThatShow * convertPct;

const pipeline         = totalLeads * avgDealValue;
const lostEngagement   = (totalLeads - leadsThatBook) * avgDealValue;
const lostAttendance   = (leadsThatBook - leadsThatShow) * avgDealValue;
const lostConversion   = (leadsThatShow - leadsThatConvert) * avgDealValue;
const closedRevenue    = leadsThatConvert * avgDealValue;
const totalMonthlyLoss = lostEngagement + lostAttendance + lostConversion;
const captureRate      = pipeline > 0 ? (closedRevenue / pipeline) * 100 : 0;

// ── Annual ──
const annual = (v) => v * 12;

// ── Biggest leak ──
const leaks = [
  { stage: "engagement", loss: lostEngagement, leads: totalLeads - leadsThatBook },
  { stage: "attendance", loss: lostAttendance, leads: leadsThatBook - leadsThatShow },
  { stage: "conversion", loss: lostConversion, leads: leadsThatShow - leadsThatConvert }
];
const biggest = leaks.reduce((max, s) => s.loss > max.loss ? s : max, leaks[0]);

const STAGE_LABELS = {
  engagement: "Engagement",
  attendance: "Attendance",
  conversion: "Conversion"
};

// ── Product recommendation ──
const LEAK_TO_PRODUCT = {
  engagement: "speed_to_lead",
  attendance: "attendance_automation",
  conversion: "conversion_followup"
};

// ── Gross margin lens (optional) ──
const MARGIN_MAP = { A: 0.95, B: 0.80, C: 0.60, D: 0.40, E: 0.25, F: null };
const marginPct = MARGIN_MAP[rawAnswers.q_estimated_gross_margin] ?? null;

// ── Format helper ──
const r = (v) => Math.round(v);

return [{
  json: {
    ...$json,
    revenueWaterfall: {
      // Inputs used (for audit trail)
      inputs: {
        leadVolume:      { value: totalLeads,          isFallback: leadVolume.isFallback },
        dealValue:       { value: avgDealValue,        isFallback: dealValue.isFallback },
        bookingRatePct:  { value: bookingRate.value,   isFallback: bookingRate.isFallback },
        attendanceRatePct: { value: attendanceRate.value, isFallback: attendanceRate.isFallback },
        conversionRatePct: { value: transactionRate.value, isFallback: transactionRate.isFallback },
      },
      anyFallback,

      // Monthly
      monthlyPipeline:        r(pipeline),
      monthlyEngagementLoss:  r(lostEngagement),
      monthlyAttendanceLoss:  r(lostAttendance),
      monthlyConversionLoss:  r(lostConversion),
      monthlyClosedRevenue:   r(closedRevenue),
      monthlyTotalLoss:       r(totalMonthlyLoss),

      // Annual (primary display)
      pipeline:          r(annual(pipeline)),
      engagementLoss:    r(annual(lostEngagement)),
      attendanceLoss:    r(annual(lostAttendance)),
      conversionLoss:    r(annual(lostConversion)),
      closedRevenue:     r(annual(closedRevenue)),
      totalLoss:         r(annual(totalMonthlyLoss)),

      // Funnel (leads per month)
      leadsIn:         totalLeads,
      leadsBooked:     r(leadsThatBook),
      leadsAttended:   r(leadsThatShow),
      leadsConverted:  r(leadsThatConvert),

      // Summary
      captureRatePercent:  Math.round(captureRate * 10) / 10,
      biggestLeakStage:    biggest.stage,
      biggestLeakLabel:    STAGE_LABELS[biggest.stage],
      biggestLeakLoss:     r(annual(biggest.loss)),
      biggestLeakLeads:    r(biggest.leads),

      // Gross margin
      grossProfitPipeline: marginPct != null ? r(annual(pipeline) * marginPct) : null,
      grossProfitAtRisk:   marginPct != null ? r(annual(totalMonthlyLoss) * marginPct) : null,
    },
    qualification: {
      ...($json.qualification || {}),
      estimated_annual_pipeline:  r(annual(pipeline)),
      estimated_annual_loss:      r(annual(totalMonthlyLoss)),
      capture_rate_percent:       Math.round(captureRate * 10) / 10,
      biggest_leak_stage:         biggest.stage,
      recommended_lead_product:   LEAK_TO_PRODUCT[biggest.stage] || "speed_to_lead",
      any_fallback_used:          anyFallback,
    }
  }
}];
```

---

## 4. Build Results HTML (Code node — returned via Respond to Webhook)

**What changed:** Remove "Estimated pipeline" and "Estimated closed revenue" rows. Show 3 loss rows (engagement, attendance, conversion). All figures annual. Rename summary label. Add industry-average disclaimer when fallbacks used.

```javascript
/**
 * Build Results HTML v3
 *
 * Generates the HTML page returned to the scorecard form via Respond to Webhook.
 * Shows the revenue waterfall with 3 loss stages + annual figures.
 *
 * Inputs:
 *   $json.revenueWaterfall.*
 *   $json.scoring.*
 *   $json.banding.*
 *   $json.pillarInsights.*
 *   $json.radarUrl
 *   $json.contact / Edit Fields data
 */

const input = $input.first().json;
const wf = input.revenueWaterfall || {};
const scoring = input.scoring || {};
const contact = input.contact || input.body?.contact || {};
const company = contact.company || input.company || "Your Company";
const firstName = (contact.name || "").split(" ")[0] || "there";

// Format currency
function fmt(val) {
  if (val == null) return "—";
  const abs = Math.abs(val);
  if (abs >= 1000000) return "£" + (val / 1000000).toFixed(1) + "M";
  if (abs >= 1000) return "£" + Math.round(val).toLocaleString("en-GB");
  return "£" + val;
}

// Waterfall rows
const waterfallRows = [
  { label: "Lost at engagement",  value: wf.engagementLoss,  prefix: "−" },
  { label: "Lost at attendance",  value: wf.attendanceLoss,  prefix: "−" },
  { label: "Lost at conversion",  value: wf.conversionLoss,  prefix: "−" },
].map(row => `
  <div class="wf-row">
    <div class="wf-arrow">↓</div>
    <div class="wf-label">${row.label}</div>
    <div class="wf-value loss">${row.prefix}${fmt(row.value)}</div>
  </div>
`).join("");

// Disclaimer banner
const disclaimerHtml = wf.anyFallback ? `
  <div class="disclaimer">
    <strong>⚠ Note:</strong> Some figures in this analysis are based on industry averages,
    as exact data was not provided. These results are illustrative — your actual losses may differ.
  </div>
` : "";

const captureRate = wf.captureRatePercent != null ? wf.captureRatePercent.toFixed(1) + "%" : "—";
const biggestLeak = wf.biggestLeakLabel || wf.biggestLeakStage || "—";

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Your Results — HumTech AI Assessment</title>
  <style>
    :root {
      --navy: #193050;
      --yellow: #D8B743;
      --blue: #3DB2DD;
      --bg: #F4F5F7;
      --card: #ffffff;
      --red: #C62828;
      --amber: #F9A825;
      --green: #2E7D32;
      --muted: rgba(25,48,80,0.65);
      --line: rgba(25,48,80,0.12);
    }
    * { box-sizing: border-box; margin: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: var(--navy);
      background: var(--bg);
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { max-width: 900px; margin: 0 auto; }

    /* Header */
    .header {
      background: var(--navy);
      color: #fff;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      position: relative;
      overflow: hidden;
    }
    .header::after {
      content: "";
      position: absolute;
      right: -40px; bottom: -40px;
      width: 200px; height: 200px;
      background: rgba(61,178,221,0.15);
      border-radius: 999px;
    }
    .brand {
      font-weight: 800;
      letter-spacing: 0.18em;
      font-size: 11px;
      text-transform: uppercase;
      opacity: 0.9;
      margin-bottom: 6px;
    }
    .title { font-size: 22px; font-weight: 850; line-height: 1.2; }
    .accent-line {
      margin-top: 14px;
      height: 4px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--yellow), var(--blue));
    }

    /* Card */
    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 4px 16px rgba(15,23,42,0.06);
    }
    .section-title {
      font-weight: 850;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(25,48,80,0.55);
      margin-bottom: 12px;
    }

    /* Waterfall */
    .wf-card { background: var(--navy); color: #fff; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
    .wf-card .section-title { color: rgba(255,255,255,0.55); }
    .wf-row {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .wf-row:last-child { border-bottom: none; }
    .wf-arrow { font-size: 18px; margin-right: 12px; opacity: 0.5; }
    .wf-label { flex: 1; font-size: 14px; font-weight: 600; }
    .wf-value { font-size: 16px; font-weight: 800; text-align: right; }
    .wf-value.loss { color: #FF6B6B; }

    /* Summary strip */
    .summary-strip {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-top: 16px;
    }
    .summary-box {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      padding: 14px;
      text-align: center;
    }
    .summary-box .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .summary-box .value {
      font-size: 20px;
      font-weight: 900;
    }
    .summary-box .value.gold { color: var(--yellow); }
    .summary-box .value.red { color: #FF6B6B; }

    /* Disclaimer */
    .disclaimer {
      background: #FFF8E1;
      border: 1px solid #F0D76E;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 12px;
      line-height: 1.5;
      color: #5D4E00;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="page">

    <div class="header">
      <div class="brand">HumTech.ai</div>
      <div class="title">Revenue Waterfall Analysis</div>
      <div class="accent-line"></div>
    </div>

    <div class="wf-card">
      <div class="section-title">Annual Revenue Loss Across Your Sales Funnel</div>

      ${waterfallRows}

      <div class="summary-strip">
        <div class="summary-box">
          <div class="label">Annual revenue loss from current sales conversion strategy</div>
          <div class="value red">${fmt(wf.totalLoss)}</div>
        </div>
        <div class="summary-box">
          <div class="label">Capture Rate</div>
          <div class="value gold">${captureRate}</div>
        </div>
        <div class="summary-box">
          <div class="label">Biggest Leak</div>
          <div class="value gold">${biggestLeak}</div>
        </div>
      </div>

      ${disclaimerHtml}
    </div>

  </div>
</body>
</html>`;

return [{ json: { ...input, resultsHtml: html } }];
```

**Wiring:** Output of this node goes to `Respond to Webhook` (set responseBody to `={{ $json.resultsHtml }}`).

---

## 5. Build PDF HTML (Code node — update existing)

**What changed:** Add waterfall section to the PDF report. All the existing radar + pillar content stays. Add a waterfall card between header and radar card.

Add this block **inside** the existing Build PDF HTML node, just before the `<!-- PAGE 1 -->` comment. Insert the waterfall card HTML after the header div:

```javascript
// ── ADD to existing Build PDF HTML node (at the top, after input parsing) ──

// Revenue waterfall data
const wf = input.revenueWaterfall || {};

function fmtCurrency(val) {
  if (val == null) return "—";
  const abs = Math.abs(val);
  if (abs >= 1000000) return "£" + (val / 1000000).toFixed(1) + "M";
  if (abs >= 1000) return "£" + Math.round(val).toLocaleString("en-GB");
  return "£" + val;
}

const waterfallRowsHtml = [
  { label: "Lost at engagement", value: wf.engagementLoss },
  { label: "Lost at attendance", value: wf.attendanceLoss },
  { label: "Lost at conversion", value: wf.conversionLoss },
].map(row => `
  <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
    <span style="font-size:12px;">↓ ${row.label}</span>
    <span style="font-size:13px;font-weight:800;color:#FF6B6B;">−${fmtCurrency(row.value)}</span>
  </div>
`).join("");

const waterfallDisclaimer = wf.anyFallback ? `
  <div style="margin-top:10px;padding:8px 12px;background:#FFF8E1;border:1px solid #F0D76E;border-radius:8px;font-size:10.5px;color:#5D4E00;line-height:1.4;">
    <strong>Note:</strong> Some figures use industry averages. Actual losses may differ.
  </div>
` : "";

const captureRateDisplay = wf.captureRatePercent != null ? wf.captureRatePercent.toFixed(1) + "%" : "—";
const biggestLeakDisplay = wf.biggestLeakLabel || wf.biggestLeakStage || "—";

const waterfallCardHtml = `
  <div class="card" style="background:var(--navy);color:#fff;margin-bottom:12px;">
    <div class="section-title" style="color:rgba(255,255,255,0.55);">Revenue Waterfall — Annual</div>
    ${waterfallRowsHtml}
    <div style="display:flex;gap:10px;margin-top:12px;">
      <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:rgba(255,255,255,0.5);margin-bottom:4px;line-height:1.3;">Annual Revenue Loss</div>
        <div style="font-size:16px;font-weight:900;color:#FF6B6B;">${fmtCurrency(wf.totalLoss)}</div>
      </div>
      <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:rgba(255,255,255,0.5);margin-bottom:4px;">Capture Rate</div>
        <div style="font-size:16px;font-weight:900;color:var(--yellow);">${captureRateDisplay}</div>
      </div>
      <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:rgba(255,255,255,0.5);margin-bottom:4px;">Biggest Leak</div>
        <div style="font-size:16px;font-weight:900;color:var(--yellow);">${biggestLeakDisplay}</div>
      </div>
    </div>
    ${waterfallDisclaimer}
  </div>
`;
```

Then in the HTML template, insert `${waterfallCardHtml}` right after the header `</div>` and before the radar `<div class="card">`.

---

## 6. GHL Payload (HTTP Request node)

**What changed:** Add new custom fields for marketing questions, waterfall data, and exact numeric values.

Update the `jsonBody` to:

```json
{
  "email": "{{ $('Edit Fields').item.json.email }}",
  "companyName": "{{ $('Edit Fields').item.json.company }}",
  "name": "{{ $('Edit Fields').item.json.name }}",
  "job_title": "{{ $('Edit Fields').item.json.job_title }}",
  "mobile": "{{ $('Edit Fields').item.json.mobile }}",
  "customFields": {
    "humtech_assessment_version": "v3",
    "humtech_submitted_at": "{{ $('Edit Fields').item.json.submitted_at }}",
    "humtech_overall_score": "{{ $('Question Scoring / pillar weight').item.json.scoring.overall.score10 }}",
    "humtech_overall_band": "{{ $('Question Scoring / pillar weight').item.json.scoring.overall.maturityBand }}",
    "humtech_lead_engagement_score": "{{ $('Question Scoring / pillar weight').item.json.scoring.pillars.leadEngagementSpeed }}",
    "humtech_appointment_reliability_score": "{{ $('Question Scoring / pillar weight').item.json.scoring.pillars.appointmentReliabilityConversion }}",
    "humtech_operational_focus_score": "{{ $('Question Scoring / pillar weight').item.json.scoring.pillars.operationalFocusTimeEfficiency }}",
    "humtech_systems_maturity_score": "{{ $('Question Scoring / pillar weight').item.json.scoring.pillars.systemsAutomationMaturity }}",
    "humtech_revenue_protection_score": "{{ $('Question Scoring / pillar weight').item.json.scoring.pillars.revenueProtectionLeakageControl }}",
    "humtech_annual_loss": "{{ $('Revenue Waterfall').item.json.revenueWaterfall.totalLoss }}",
    "humtech_capture_rate": "{{ $('Revenue Waterfall').item.json.revenueWaterfall.captureRatePercent }}",
    "humtech_biggest_leak": "{{ $('Revenue Waterfall').item.json.revenueWaterfall.biggestLeakStage }}",
    "humtech_lead_volume": "{{ $('Revenue Waterfall').item.json.revenueWaterfall.inputs.leadVolume.value }}",
    "humtech_deal_value": "{{ $('Revenue Waterfall').item.json.revenueWaterfall.inputs.dealValue.value }}",
    "humtech_booking_rate": "{{ $('Revenue Waterfall').item.json.revenueWaterfall.inputs.bookingRatePct.value }}",
    "humtech_attendance_rate": "{{ $('Revenue Waterfall').item.json.revenueWaterfall.inputs.attendanceRatePct.value }}",
    "humtech_conversion_rate": "{{ $('Revenue Waterfall').item.json.revenueWaterfall.inputs.conversionRatePct.value }}",
    "humtech_marketing_channels": "{{ $('Question Scoring / pillar weight').item.json.scoring.informative.qMarketingChannels }}",
    "humtech_marketing_spend": "{{ $('Question Scoring / pillar weight').item.json.scoring.informative.qMarketingSpend }}",
    "humtech_cro_specialist": "{{ $('Question Scoring / pillar weight').item.json.scoring.informative.qCroSpecialist }}"
  }
}
```

**Note:** You'll need to create these custom fields in GHL first (contact custom fields). The field names in GHL custom fields must match exactly.

---

## 7. Workflow Connection Changes

Current flow:
```
Webhook → Edit Fields → Question Scoring → Banding → Radar Chart → Build PDF HTML → Respond to Webhook → PDFShift → Email
                                                                                    → GHL HTTP Request
```

New flow (add Revenue Waterfall node):
```
Webhook → Edit Fields → Question Scoring → Revenue Waterfall → Banding → Radar Chart → Build PDF HTML → Respond to Webhook → PDFShift → Email
                                                                                       ↘ Build Results HTML → Respond to Webhook
                                                                                       → GHL HTTP Request (reads from Revenue Waterfall)
```

Or simpler — add Revenue Waterfall right after Question Scoring:
```
Edit Fields → Question Scoring → Revenue Waterfall → Banding → Radar Chart → Build PDF HTML
```

The Revenue Waterfall node reads `numericAnswers` (from Edit Fields pass-through) and `rawAnswers`. It doesn't depend on scoring output, so it can go anywhere after Edit Fields. Placing it after Question Scoring keeps the flow logical.

---

## Checklist

- [ ] Back up current workflow JSON
- [ ] Update Edit Fields assignments
- [ ] Replace Question Scoring code
- [ ] Add Revenue Waterfall code node
- [ ] Wire Revenue Waterfall into flow
- [ ] Add Build Results HTML code node (or update Respond to Webhook)
- [ ] Update Build PDF HTML with waterfall section
- [ ] Update GHL payload with new fields
- [ ] Create GHL custom fields
- [ ] Test with production webhook (all numeric filled)
- [ ] Test with some fallbacks (verify disclaimer)
