"""
Update n8n Scorecard workflow to v3.
Pure v3 — deploy frontend form at the same time.

Usage: python scripts/update_n8n_workflow.py
"""
import json
import urllib.request
import uuid

N8N_API_URL = "https://n8n.resg.uk"
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YjU5MTU0OS1hZTE5LTQ5MGYtYTg4ZC03N2RlNmEwZWY1MDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZTUzNWE4ZTgtM2UxNC00YzBmLTkwNmUtMmYxNjEzODEwNzM1IiwiaWF0IjoxNzcxNTM4MzE5fQ.eCzg70GoihdUv1AFcg_C57rBeArVay1Ag484lkYOtY0"
WORKFLOW_ID = "UPceXr0EYkOlRsjz"


def api(method, path, body=None):
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(
        f"{N8N_API_URL}{path}",
        data=data,
        headers={"X-N8N-API-KEY": N8N_API_KEY, "Content-Type": "application/json"},
        method=method,
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


# ═══════════════════════════════════════════
# v3 Code for each node
# ═══════════════════════════════════════════

QUESTION_SCORING_CODE = r"""/**
 * HumTech Score Assessment v3
 *
 * v3: q4_show_rate is numeric (0-100%).
 *     When rawAnswers.q4_show_rate === "NUMERIC", reads exact % from numericAnswers.
 *     Fallback "F" scores 0.
 */

const raw = $json.rawAnswers || {};
const numericAnswers = $json.numericAnswers || {};
const freeText = $json.freeText || {};

const SCORE_0_TO_5 = {
  q1_engagement_method:           { A: 5, B: 4, C: 2, D: 3, E: 0 },
  q2_response_time:               { A: 5, B: 4, C: 3, D: 2, E: 0 },
  q3_247_booking:                 { A: 5, B: 0 },
  q5_repetitive_manual_processes: { A: 5, B: 4, C: 3, D: 2, E: 0 },
  q6_issue_detection:             { A: 2, B: 3, C: 4, D: 5 },
  q7_metric_tracking:             { A: 5, B: 4, C: 3, D: 2 },
  q8_non_revenue_time:            { A: 5, B: 4, C: 3, D: 2, E: 0 },
  q11_documents_and_signatures:   { A: 5, B: 4, C: 0, D: 0, E: 0 },
  q12_current_situation:          { A: 5, B: 3, C: 1 },
};

const PILLARS = [
  "leadEngagementSpeed",
  "appointmentReliabilityConversion",
  "operationalFocusTimeEfficiency",
  "systemsAutomationMaturity",
  "revenueProtectionLeakageControl"
];

const QUESTION_WEIGHTS = {
  q1_engagement_method:           { leadEngagementSpeed: 0.6, revenueProtectionLeakageControl: 0.4 },
  q2_response_time:               { leadEngagementSpeed: 0.7, revenueProtectionLeakageControl: 0.3 },
  q3_247_booking:                 { leadEngagementSpeed: 0.4, systemsAutomationMaturity: 0.6 },
  q4_show_rate:                   { appointmentReliabilityConversion: 0.6, revenueProtectionLeakageControl: 0.4 },
  q5_repetitive_manual_processes: { systemsAutomationMaturity: 1.0 },
  q6_issue_detection:             { systemsAutomationMaturity: 0.6, revenueProtectionLeakageControl: 0.4 },
  q7_metric_tracking:             { operationalFocusTimeEfficiency: 1.0 },
  q8_non_revenue_time:            { operationalFocusTimeEfficiency: 0.6, revenueProtectionLeakageControl: 0.4 },
  q11_documents_and_signatures:   { systemsAutomationMaturity: 0.7, operationalFocusTimeEfficiency: 0.3 },
  q12_current_situation:          { systemsAutomationMaturity: 0.6, revenueProtectionLeakageControl: 0.4 },
};

function scoreQuestion0to5(qid, answerId) {
  if (qid === "q4_show_rate") {
    if (answerId === "NUMERIC") {
      const entry = numericAnswers.q4_show_rate;
      if (entry && entry.value != null && !entry.isFallback) {
        return Math.max(0, Math.min(5, (entry.value / 100) * 5));
      }
      return 0;
    }
    if (answerId === "F") return 0;
    return 0;
  }
  const map = SCORE_0_TO_5[qid];
  if (!map) return 0;
  return typeof map[answerId] === "number" ? map[answerId] : 0;
}

function to0to10(s) { return (s / 5) * 10; }
function clamp(v) { return Math.max(0, Math.min(10, v)); }

const pillarTotals = Object.fromEntries(PILLARS.map(p => [p, 0]));
const pillarWeightSums = Object.fromEntries(PILLARS.map(p => [p, 0]));
const missingQuestions = [];

for (const qid of Object.keys(QUESTION_WEIGHTS)) {
  const ans = raw[qid];
  if (!ans) missingQuestions.push(qid);
  const s = to0to10(scoreQuestion0to5(qid, ans));
  for (const [pillar, w] of Object.entries(QUESTION_WEIGHTS[qid])) {
    pillarTotals[pillar] += s * w;
    pillarWeightSums[pillar] += w;
  }
}

const pillars = {};
for (const p of PILLARS) {
  const d = pillarWeightSums[p] || 0;
  pillars[p] = clamp(Math.round((d ? pillarTotals[p] / d : 0) * 10) / 10);
}
const radar = { ...pillars };

const PILLAR_IMPORTANCE = {
  leadEngagementSpeed: 0.22,
  appointmentReliabilityConversion: 0.22,
  operationalFocusTimeEfficiency: 0.22,
  systemsAutomationMaturity: 0.22,
  revenueProtectionLeakageControl: 0.12
};

let num = 0, den = 0;
for (const p of PILLARS) {
  const w = PILLAR_IMPORTANCE[p] || 0;
  num += (pillars[p] || 0) * w;
  den += w;
}
const score10 = clamp(Math.round((den ? num / den : 0) * 10) / 10);
const percent = Math.round((score10 / 10) * 100);

function bandFor(s) {
  if (s < 5.0) return "Critical";
  if (s < 7.0) return "Action Required";
  if (s < 9.0) return "Average";
  return "Optimised";
}

const informative = {
  q13DesiredOutcome: (() => {
    const v = raw.q13_desired_outcome;
    return Array.isArray(v) ? v : (typeof v === "string" && v ? [v] : null);
  })(),
  q14AiBarriers: (() => {
    const v = raw.q14_ai_barriers;
    return Array.isArray(v) ? v : (typeof v === "string" && v ? [v] : null);
  })(),
  q16AdditionalNotes: freeText.q16_additional_notes || null,
  qMarketingChannels: (() => {
    const v = raw.q_marketing_channels;
    return Array.isArray(v) ? v : (typeof v === "string" && v ? [v] : null);
  })(),
  qMarketingSpend: raw.q_marketing_spend || null,
  qCroSpecialist: raw.q_cro_specialist || null,
};

return [{
  json: {
    ...$json,
    scoring: {
      radar,
      pillars,
      overall: { score10, percent, maturityBand: bandFor(score10) },
      informative,
      qa: { missingQuestions }
    }
  }
}];
"""


REVENUE_WATERFALL_CODE = r"""/**
 * Revenue Waterfall v3 — 3-Stage Leads-Based Cascade
 *
 * No ghost rate. Every number from the lead's own answers.
 * When "unsure" fallback selected, uses industry defaults + flags it.
 * All primary figures are ANNUAL (x12).
 */

const numericAnswers = $json.numericAnswers || {};
const rawAnswers = $json.rawAnswers || {};
const q = $json.qualification || {};

const DEFAULTS = {
  leadVolume: 125,
  dealValue: 1250,
  bookingRate: 50,
  attendanceRate: 70,
  transactionRate: 55
};

function getVal(qid, fallback) {
  const entry = numericAnswers[qid];
  if (entry && !entry.isFallback && entry.value != null) {
    return { value: entry.value, isFallback: false };
  }
  return { value: fallback, isFallback: true };
}

const leadVolume      = getVal("q_lead_volume",     DEFAULTS.leadVolume);
const dealValue       = getVal("q_deal_value",       DEFAULTS.dealValue);
const bookingRate     = getVal("q4_show_rate",       DEFAULTS.bookingRate);
const attendanceRate  = getVal("q_attendance_rate",  DEFAULTS.attendanceRate);
const transactionRate = getVal("q_transaction_rate", DEFAULTS.transactionRate);

const anyFallback = leadVolume.isFallback || dealValue.isFallback ||
                    bookingRate.isFallback || attendanceRate.isFallback ||
                    transactionRate.isFallback;

// 3-Stage Waterfall (monthly)
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

const r = (v) => Math.round(v);

// Biggest leak
const leaks = [
  { stage: "engagement", label: "Engagement", loss: lostEngagement, leads: totalLeads - leadsThatBook },
  { stage: "attendance", label: "Attendance", loss: lostAttendance, leads: leadsThatBook - leadsThatShow },
  { stage: "conversion", label: "Conversion", loss: lostConversion, leads: leadsThatShow - leadsThatConvert }
];
const biggest = leaks.reduce((max, s) => s.loss > max.loss ? s : max, leaks[0]);

const LEAK_TO_PRODUCT = {
  engagement: "speed_to_lead",
  attendance: "attendance_automation",
  conversion: "conversion_followup"
};

// Gross margin lens
const grossMarginMid = { A: 0.90, B: 0.80, C: 0.60, D: 0.40, E: 0.25, F: null };
const grossRevenueAnnualMid = { A: 60000000, B: 30000000, C: 7500000, D: 4000000, E: 2000000, F: null };
const marginPct = grossMarginMid[rawAnswers.q_estimated_gross_margin] ?? null;
const estAnnualRevenue = grossRevenueAnnualMid[rawAnswers.q_estimated_gross_revenue] ?? null;

return [{
  json: {
    ...$json,
    revenueWaterfall: {
      version: "v3",
      inputs: {
        leadVolume:        { value: totalLeads,            isFallback: leadVolume.isFallback },
        dealValue:         { value: avgDealValue,          isFallback: dealValue.isFallback },
        bookingRatePct:    { value: bookingRate.value,     isFallback: bookingRate.isFallback },
        attendanceRatePct: { value: attendanceRate.value,  isFallback: attendanceRate.isFallback },
        conversionRatePct: { value: transactionRate.value, isFallback: transactionRate.isFallback },
      },
      anyFallback,

      // Primary display: annual
      leadVolume: totalLeads,
      avgDealValue,
      pipeline:        r(pipeline * 12),
      engagementLoss:  r(lostEngagement * 12),
      attendanceLoss:  r(lostAttendance * 12),
      conversionLoss:  r(lostConversion * 12),
      closedValue:     r(closedRevenue * 12),
      totalLoss:       r(totalMonthlyLoss * 12),

      // Monthly
      monthlyPipeline:        r(pipeline),
      monthlyEngagementLoss:  r(lostEngagement),
      monthlyAttendanceLoss:  r(lostAttendance),
      monthlyConversionLoss:  r(lostConversion),
      monthlyClosedRevenue:   r(closedRevenue),
      monthlyTotalLoss:       r(totalMonthlyLoss),

      // Funnel (leads per month)
      leadsIn:         totalLeads,
      leadsBooked:     r(leadsThatBook),
      leadsAttended:   r(leadsThatShow),
      leadsConverted:  r(leadsThatConvert),

      // Summary
      captureRatePercent: Math.round(captureRate * 10) / 10,
      biggestLeakStage:  biggest.stage,
      biggestLeakLabel:  biggest.label,
      biggestLeakLoss:   r(biggest.loss * 12),
      biggestLeakLeads:  r(biggest.leads),

      // Gross margin
      estimatedAnnualRevenue: estAnnualRevenue,
      estimatedGrossMargin: marginPct,
      grossProfitPipeline: marginPct != null ? r(pipeline * 12 * marginPct) : null,
      grossProfitAtRisk:   marginPct != null ? r(totalMonthlyLoss * 12 * marginPct) : null,
    },
    qualification: {
      ...q,
      estimated_monthly_pipeline:  r(pipeline),
      estimated_monthly_loss:      r(totalMonthlyLoss),
      estimated_annual_pipeline:   r(pipeline * 12),
      estimated_annual_loss:       r(totalMonthlyLoss * 12),
      capture_rate_percent:        Math.round(captureRate * 10) / 10,
      biggest_leak_stage:          biggest.stage,
      recommended_lead_product:    LEAK_TO_PRODUCT[biggest.stage] || "speed_to_lead",
      any_fallback_used:           anyFallback,
      decision_maker: true,
    }
  }
}];
"""


GHL_PAYLOAD_CODE = r"""// Build GHL Payload v3

const edit = $('Edit Fields').first().json;
const scoring = $('Question Scoring / pillar weight').first().json;
const waterfall = $('Revenue Waterfall / Qualification').first().json;

const allAnswers = edit.answers || [];
const wf = waterfall.revenueWaterfall || {};
const qual = waterfall.qualification || {};

const fullName = (edit.name || '').trim();
const nameParts = fullName.split(/\s+/).filter(Boolean);
const firstName = nameParts[0] || '';
const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

const answerLines = allAnswers.map((a) => {
  const t = Array.isArray(a.answerText) ? a.answerText.join('; ') : (a.answerText || '');
  return `${a.questionText}: ${t}`;
});
const scoredLines = allAnswers.filter(a => a.isScored).map((a) => {
  const t = Array.isArray(a.answerText) ? a.answerText.join('; ') : (a.answerText || '');
  return `${a.questionText}: ${t}`;
});
const infoLines = allAnswers.filter(a => !a.isScored).map((a) => {
  const t = Array.isArray(a.answerText) ? a.answerText.join('; ') : (a.answerText || '');
  return `${a.questionText}: ${t}`;
});

const payload = {
  email: edit.email || '',
  companyName: edit.company || '',
  name: fullName,
  firstName,
  lastName,
  job_title: edit.job_title || '',
  mobile: edit.mobile || '',
  submission_id: edit.submission_id || '',
  customFields: {
    humtech_assessment_version: 'v3',
    humtech_assessment_source: edit.source || 'humtech-scorecard',
    humtech_submitted_at: edit.submitted_at || '',
    humtech_first_name: firstName,
    humtech_last_name: lastName,

    humtech_overall_score: scoring.scoring?.overall?.score10 || '',
    humtech_overall_band: scoring.scoring?.overall?.maturityBand || '',
    humtech_lead_engagement_score: scoring.scoring?.pillars?.leadEngagementSpeed || '',
    humtech_appointment_reliability_score: scoring.scoring?.pillars?.appointmentReliabilityConversion || '',
    humtech_operational_focus_score: scoring.scoring?.pillars?.operationalFocusTimeEfficiency || '',
    humtech_systems_maturity_score: scoring.scoring?.pillars?.systemsAutomationMaturity || '',
    humtech_revenue_protection_score: scoring.scoring?.pillars?.revenueProtectionLeakageControl || '',

    // Waterfall (annual)
    humtech_annual_pipeline: wf.pipeline || '',
    humtech_annual_loss: wf.totalLoss || '',
    humtech_capture_rate_percent: wf.captureRatePercent || '',
    humtech_biggest_leak_stage: wf.biggestLeakStage || '',
    humtech_annual_closed_value: wf.closedValue || '',
    humtech_recommended_lead_product: qual.recommended_lead_product || '',

    // Exact inputs
    humtech_lead_volume: wf.inputs?.leadVolume?.value || '',
    humtech_deal_value: wf.inputs?.dealValue?.value || '',
    humtech_booking_rate: wf.inputs?.bookingRatePct?.value || '',
    humtech_attendance_rate: wf.inputs?.attendanceRatePct?.value || '',
    humtech_conversion_rate: wf.inputs?.conversionRatePct?.value || '',
    humtech_any_fallback_used: wf.anyFallback ? 'true' : 'false',

    // Marketing
    humtech_marketing_channels: scoring.scoring?.informative?.qMarketingChannels
      ? (Array.isArray(scoring.scoring.informative.qMarketingChannels)
        ? scoring.scoring.informative.qMarketingChannels.join(', ')
        : scoring.scoring.informative.qMarketingChannels)
      : '',
    humtech_marketing_spend: scoring.scoring?.informative?.qMarketingSpend || '',
    humtech_cro_specialist: scoring.scoring?.informative?.qCroSpecialist || '',

    // Raw data
    humtech_assessment_raw_json: JSON.stringify(edit.rawAnswers || {}),
    humtech_assessment_answers_json: JSON.stringify(allAnswers || []),
    humtech_answers_readable: answerLines.join('\n'),
    humtech_scored_answers_readable: scoredLines.join('\n'),
    humtech_informative_answers_readable: infoLines.join('\n'),
  },
};

return [{ json: { ...$json, ghl_payload: payload } }];
"""


NEW_EDIT_FIELDS = [
    {"id": str(uuid.uuid4()), "name": "numericAnswers",    "value": "={{ $json.body.numericAnswers }}",    "type": "object"},
    {"id": str(uuid.uuid4()), "name": "qualification",     "value": "={{ $json.body.qualification }}",     "type": "object"},
    {"id": str(uuid.uuid4()), "name": "assessment_version", "value": "={{ $json.body.assessment_version }}", "type": "string"},
]


def main():
    print("1. Fetching current workflow...")
    wf = api("GET", f"/api/v1/workflows/{WORKFLOW_ID}")
    print(f"   Got: {wf['name']} ({len(wf['nodes'])} nodes)")

    for node in wf["nodes"]:
        name = node["name"]

        if name == "Question Scoring / pillar weight":
            print(f"2. Updating: {name}")
            node["parameters"]["jsCode"] = QUESTION_SCORING_CODE

        elif name == "Revenue Waterfall / Qualification":
            print(f"3. Updating: {name}")
            node["parameters"]["jsCode"] = REVENUE_WATERFALL_CODE

        elif name == "prepare payload for GHL":
            print(f"4. Updating: {name}")
            node["parameters"]["jsCode"] = GHL_PAYLOAD_CODE

        elif name == "Edit Fields":
            print(f"5. Updating: {name}")
            assignments = node["parameters"]["assignments"]["assignments"]
            for a in assignments:
                if a["name"] == "assessment_id":
                    a["value"] = "humtech_v3"
            existing = {a["name"] for a in assignments}
            for new_a in NEW_EDIT_FIELDS:
                if new_a["name"] not in existing:
                    assignments.append(new_a)

    # Build minimal PUT payload (only accepted fields)
    update = {
        "name": wf["name"],
        "nodes": wf["nodes"],
        "connections": wf["connections"],
        "settings": {
            "executionOrder": wf.get("settings", {}).get("executionOrder", "v1"),
            "timezone": wf.get("settings", {}).get("timezone", "Europe/London"),
        },
    }

    print("6. Pushing updated workflow to n8n...")
    result = api("PUT", f"/api/v1/workflows/{WORKFLOW_ID}", update)
    print(f"   Success! Version: {result.get('versionId', '?')}")
    print(f"   Name: {result.get('name', '?')}")


if __name__ == "__main__":
    main()
