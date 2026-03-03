"""
Add contextual solution recommendations to scorecard results.
Updates Revenue Waterfall (adds solution selection) and Build PDF HTML (renders cards).

Usage: python -X utf8 scripts/update_n8n_solutions.py
"""
import json
import urllib.request

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
# Revenue Waterfall — adds solutions[] output
# ═══════════════════════════════════════════

REVENUE_WATERFALL_CODE = r"""/**
 * Revenue Waterfall v4 — Benchmark-Based Gap Model + Solution Recommendations
 *
 * Loss = gap between lead's actual rates and industry benchmarks.
 * If a rate exceeds the benchmark, that stage shows £0 recoverable.
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

const BENCHMARKS = {
  bookingRate: 70,
  attendanceRate: 85,
  conversionRate: 50
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

// 3-Stage Waterfall (monthly) — actual funnel
const totalLeads    = leadVolume.value;
const avgDealValue  = dealValue.value;
const bookPct       = bookingRate.value / 100;
const showPct       = attendanceRate.value / 100;
const convertPct    = transactionRate.value / 100;

const leadsThatBook    = totalLeads * bookPct;
const leadsThatShow    = leadsThatBook * showPct;
const leadsThatConvert = leadsThatShow * convertPct;

const pipeline         = totalLeads * avgDealValue;
const closedRevenue    = leadsThatConvert * avgDealValue;
const captureRate      = pipeline > 0 ? (closedRevenue / pipeline) * 100 : 0;

// Benchmark gap — recoverable revenue at each stage
const engGapPct    = Math.max(0, BENCHMARKS.bookingRate - bookingRate.value) / 100;
const attGapPct    = Math.max(0, BENCHMARKS.attendanceRate - attendanceRate.value) / 100;
const convGapPct   = Math.max(0, BENCHMARKS.conversionRate - transactionRate.value) / 100;

const lostEngagement   = totalLeads * engGapPct * avgDealValue;
const lostAttendance   = leadsThatBook * attGapPct * avgDealValue;
const lostConversion   = leadsThatShow * convGapPct * avgDealValue;
const totalMonthlyLoss = lostEngagement + lostAttendance + lostConversion;

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
const grossRevenueAnnualMid = { A: 60000000, B: 30000000, C: 7500000, D: 4000000, E: 2000000, F: null };
const marginEntry = numericAnswers["q_estimated_gross_margin"];
const marginPct = (marginEntry && !marginEntry.isFallback && marginEntry.value != null)
  ? marginEntry.value / 100 : null;
const estAnnualRevenue = grossRevenueAnnualMid[rawAnswers.q_estimated_gross_revenue] ?? null;

// ── Solution Recommendations ──
const SOLUTIONS = {
  engagement: {
    tag: "Revenue Recovery",
    title: "Low Booking Rates Are Wasting Your Lead Investment",
    bullets: [
      "Unless you currently utilise multivariate testing and conversion modules integrated into your client software, you will be wasting a significant portion of your budget on acquiring low intent, poorly qualified leads. Ensure the system you\u2019re using is sufficiently advanced to utilise data from your CRM to continually refine your pixel/data set.",
      "Most companies don\u2019t employ necessary psychological principles on their websites, landers or data capture vehicles to ensure maximum appointment attendance. If your lead capture form only collects contact information, this will attenuate lead quality.",
      "AI methodologies are outperforming non-AI informed paid outreach systems in the production of high performing creatives. It\u2019s important to stay ahead of the curve here as competitors will be adopting these strategies."
    ]
  },
  attendance: {
    tag: "Revenue Recovery",
    title: "High No-Show Rates Are Draining Sales Capacity",
    bullets: [
      "If you are currently receiving leads without automated conversational appointment booking and an appropriate follow up sequence you will almost certainly have poorer attendance. Review your \u2018client touch point journey\u2019 and automate this process to improve show up rates without additional resource requirements.",
      "Most companies don\u2019t employ necessary psychological principles on their websites, landers or data capture vehicles. Copy changes and form integrations which enhance the lead mindset and starting dynamic are a relatively quick fix.",
      "Ensure the system you\u2019re using is sufficiently advanced to utilise data from your CRM to continually refine your pixel/data set. AI methodologies are outperforming non-AI informed paid outreach systems in the production of high performing creatives."
    ]
  },
  conversion: {
    tag: "Revenue Recovery",
    title: "Close More Deals Post-Meeting",
    bullets: [
      "Automated post-meeting follow-up sequences that maintain momentum through the decision window",
      "Systematic close process that removes reliance on individual sales performance",
      "Pipeline tracking and AI re-engagement for stalled opportunities"
    ]
  },
  operational: {
    tag: "Operational Efficiency",
    title: "Too Much Time is Spent on Non-Core Work",
    bullets: [
      "It is possible to automate approx. 70% of manual tasks in most businesses within a few weeks. Your staff should not be performing any manual repetitive tasks. A single action on your CRM automatically updates all associated business outcomes \u2014 relevant software, spreadsheets, financial reporting, sends communications or calls the client. Like a ripple in a pond, a single 3 second action accounts for the work of several staff members.",
      "Your team should not be spending time attempting to engage colder leads or old data sets. This is a thankless task which impacts morale negatively. AI can comb and engage existing data to liberate trapped revenue without burdening staff.",
      "Core work differs between businesses, even in the same industry. It\u2019s useful to have a third party assess all areas of your business (sales/finance/compliance/client services) to suggest a comprehensive list of time deflection solutions. You will be surprised at the impact that custom-made departmental interventions have on morale, performance and sick days."
    ]
  },
  documents: {
    tag: "Compliance & Documents",
    title: "Secure, Automated Document Handling",
    bullets: [
      "If your business sends or receives documents such as compliance or AML, it is of paramount importance that you request documents and/or signatures via an online portal with a UK data centre. If you presently use a third party service, check that their data is stored in the UK \u2014 if not, you are not presently UK GDPR compliant.",
      "Document requests should be automated and chasing left to AI. Most third-party document request systems are not compliant and lack personal branding \u2014 sending a link which displays \u2018DocuSign\u2019 branding delivers much lower adherence than a portal with your company branding which you own and control fully.",
      "We predict potential future ICO infringement cases on the basis of improper collection and storage of personal data \u2014 this is especially important if you collect any \u2018special category\u2019 data."
    ]
  }
};

// Build candidate solutions with priorities
const candidates = [];

// Category 1: Biggest leak (always included, priority 10)
if (SOLUTIONS[biggest.stage]) {
  candidates.push({ ...SOLUTIONS[biggest.stage], priority: 10 });
}

// Category 1b: Second-biggest leak if >30% of total loss
const sortedLeaks = [...leaks].sort((a, b) => b.loss - a.loss);
if (sortedLeaks.length >= 2 && totalMonthlyLoss > 0) {
  const secondLeak = sortedLeaks[1];
  const secondPct = secondLeak.loss / totalMonthlyLoss;
  if (secondPct > 0.30 && secondLeak.stage !== biggest.stage && SOLUTIONS[secondLeak.stage]) {
    candidates.push({ ...SOLUTIONS[secondLeak.stage], priority: 7 });
  }
}

// Category 2: Operational Efficiency (q5=D/E or q8=D/E)
const q5 = rawAnswers.q5_repetitive_manual_processes;
const q8 = rawAnswers.q8_non_revenue_time;
const opsPriority = ((q5 === "D" || q5 === "E") ? 4 : 0) + ((q8 === "D" || q8 === "E") ? 4 : 0);
if (opsPriority > 0) {
  candidates.push({ ...SOLUTIONS.operational, priority: opsPriority });
}

// Category 3: Documents & Compliance (q11=C or E)
const q11 = rawAnswers.q11_documents_and_signatures;
if (q11 === "C") {
  candidates.push({ ...SOLUTIONS.documents, priority: 6 });
} else if (q11 === "E") {
  candidates.push({ ...SOLUTIONS.documents, priority: 5 });
}

// Select top 3, sorted by priority
candidates.sort((a, b) => b.priority - a.priority);
const selectedSolutions = candidates.slice(0, 3);

return [{
  json: {
    ...$json,
    solutions: selectedSolutions,
    revenueWaterfall: {
      version: "v4",
      benchmarks: BENCHMARKS,
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


# ═══════════════════════════════════════════
# Build PDF HTML — adds solution cards
# ═══════════════════════════════════════════

BUILD_PDF_HTML_CODE = r"""const input = $input.first().json;

const company   = input.company_name || input.company || "Your Company";
const email     = input.email || "\u2014";
const rawDate = input.submitted_at || input.submitted || new Date().toISOString();
const submittedDate = new Date(rawDate);
const submitted = submittedDate instanceof Date && !isNaN(submittedDate)
  ? String(submittedDate.getDate()).padStart(2,'0') + '-' + String(submittedDate.getMonth()+1).padStart(2,'0') + '-' + String(submittedDate.getFullYear()).slice(-2)
  : rawDate;
const radarUrl  = input.radarUrl || input.radar_url || "";

const overallScore =
  input.scoring?.overall?.score10 ?? input.overall_score ?? input.overallScore ?? "\u2014";
const overallBand  =
  input.banding?.overallBand?.bandLabel ?? input.scoring?.overall?.maturityBand ??
  input.overall_band_label ?? input.overallBandLabel ?? "\u2014";

const wf     = input.revenueWaterfall || {};
const money  = (n) => typeof n === "number" ? `\u00a3${Math.round(n).toLocaleString()}` : "N/A";
const pct    = (n) => typeof n === "number" ? `${n}%` : "N/A";
const stg    = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "N/A";

const PILLAR_ORDER = [
  "leadEngagementSpeed",
  "appointmentReliabilityConversion",
  "operationalFocusTimeEfficiency",
  "systemsAutomationMaturity",
  "revenueProtectionLeakageControl"
];
const PILLAR_LABELS = {
  leadEngagementSpeed:              "Lead Engagement & Efficacy",
  appointmentReliabilityConversion: "Appointment Reliability & Conversion",
  operationalFocusTimeEfficiency:   "Operational Focus & Time Efficiency",
  systemsAutomationMaturity:        "Systems & Automation Maturity",
  revenueProtectionLeakageControl:  "Revenue Protection & Leakage Control"
};

const pillarScores   = input.scoring?.pillars || input.scoring?.radar || {};
const pillarInsights = input.pillarInsights || {};

const TL = {
  "critical":         "#C0392B",
  "action required":  "#C0392B",
  "average":          "#D48C22",
  "optimised":        "#1E7D4B",
};
const tl = (b) => TL[String(b||"").toLowerCase().trim()] ?? "#D48C22";

const overallColor   = tl(overallBand);
const overallDisplay = typeof overallScore === "number" ? overallScore.toFixed(1) : overallScore;

// Pillar stat cards
const pillarRowsHtml = PILLAR_ORDER.map(k => {
  const score   = pillarInsights[k]?.score    ?? pillarScores[k] ?? 0;
  const band    = pillarInsights[k]?.bandLabel ?? "\u2014";
  const meaning = pillarInsights[k]?.bandMeaning ?? "";
  const label   = pillarInsights[k]?.pillarLabel ?? PILLAR_LABELS[k] ?? k;
  const desc    = String(meaning || "").replace(/\s+/g, " ").trim();
  const c       = tl(band);
  return `
    <div class="pillar-stat">
      <div class="ps-score" style="color:${c};">${Number(score).toFixed(1)}<span class="ps-den">/10</span></div>
      <div class="ps-band"><span class="ps-dot" style="background:${c};"></span>${band}</div>
      <div class="ps-name">${label}</div>
      ${desc ? `<div class="ps-desc">${desc}</div>` : ""}
    </div>`;
}).join("");

// Waterfall rows
const pipeline = wf.pipeline || 0;
const engLoss  = wf.engagementLoss  || 0;
const attLoss  = wf.attendanceLoss  || 0;
const convLoss = wf.conversionLoss  || 0;
const closed   = wf.closedValue     || 0;
const totalLoss = wf.totalLoss || (engLoss + attLoss + convLoss);
const bm       = wf.benchmarks || { bookingRate: 70, attendanceRate: 85, conversionRate: 50 };
const inputs   = wf.inputs || {};
const maxVal   = Math.max(Math.max(engLoss, attLoss, convLoss), 1);
const bar      = (v) => Math.min(100, Math.max(2, (v / maxVal) * 100));

const wfRowsData = [
  { label:"Engagement gap",  yourRate: inputs.bookingRatePct?.value,    bmRate: bm.bookingRate,    loss: engLoss  },
  { label:"Attendance gap",  yourRate: inputs.attendanceRatePct?.value, bmRate: bm.attendanceRate, loss: attLoss  },
  { label:"Conversion gap",  yourRate: inputs.conversionRatePct?.value, bmRate: bm.conversionRate, loss: convLoss },
];

const wfRowsHtml = wfRowsData.map(r => {
  const aboveBenchmark = r.loss === 0;
  const desc = aboveBenchmark
    ? `Your rate: ${r.yourRate}% \u00b7 At or above benchmark (${r.bmRate}%)`
    : `Your rate: ${r.yourRate}% \u00b7 Benchmark: ${r.bmRate}%`;
  const ic = aboveBenchmark
    ? { bg:"rgba(30,125,75,0.10)", c:"#1E7D4B", sym:"\u2713" }
    : { bg:"rgba(192,57,43,0.10)", c:"#C0392B", sym:"\u2198" };
  const barColor = aboveBenchmark ? "#1E7D4B" : "#C0392B";
  const amtColor = aboveBenchmark ? "#1E7D4B" : "#C0392B";
  const amtText  = aboveBenchmark ? "\u2014" : `\u2212${money(r.loss)}`;
  return `
    <div class="wf-row">
      <div class="wf-icon-col">
        <div class="wf-circle" style="background:${ic.bg};color:${ic.c};">${ic.sym}</div>
      </div>
      <div>
        <div class="wf-label">${r.label}</div>
        <div class="wf-desc">${desc}</div>
      </div>
      <div class="wf-bar-col">
        <div class="wf-bar-track"><div class="wf-bar-fill" style="width:${aboveBenchmark ? 2 : bar(r.loss)}%;background:${barColor};"></div></div>
      </div>
      <div class="wf-amount" style="color:${amtColor};">${amtText}</div>
    </div>`;
}).join("");

// Qual cards
const qualCardsHtml = PILLAR_ORDER.map((k) => {
  const label = pillarInsights[k]?.pillarLabel ?? PILLAR_LABELS[k] ?? k;
  const band  = pillarInsights[k]?.bandLabel ?? "\u2014";
  const score = pillarInsights[k]?.score ?? pillarScores[k] ?? 0;
  const title = pillarInsights[k]?.title ?? "\u2014";
  const body  = pillarInsights[k]?.body  ?? "\u2014";
  const c     = tl(band);
  return `
    <div class="qual-item">
      <div class="qual-head-row">
        <div>
          <div class="qual-pillar-label">${label}</div>
          <div class="qual-title">${title}</div>
        </div>
        <div class="qual-score-pill">
          <div class="qual-score-num" style="color:${c};">${Number(score).toFixed(1)}<span class="qual-score-den">/10</span></div>
          <div class="qual-band-pill"><span class="q-dot" style="background:${c};"></span>${band}</div>
        </div>
      </div>
      <div class="qual-body">${body}</div>
    </div>`;
}).join("");

// ── Solution Cards ──
const solutions = input.solutions || [];
const solutionCardsHtml = solutions.length > 0 ? solutions.map(sol => `
  <div class="sol-card">
    <div class="sol-tag">${sol.tag}</div>
    <div class="sol-title">${sol.title}</div>
    <ul class="sol-bullets">
      ${sol.bullets.map(b => `<li>${b}</li>`).join("")}
    </ul>
  </div>
`).join("") : "";

const solutionSectionHtml = solutionCardsHtml ? `
  <div class="card">
    <div class="card-head">
      <span class="card-title">Recommended Solutions</span>
      <span class="card-sub">Based on your specific assessment results</span>
    </div>
    <div style="padding:16px 22px;">
      <div class="solutions-grid">
        ${solutionCardsHtml}
      </div>
    </div>
  </div>
` : "";

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <title>HumTech \u2014 ${company}</title>
  <style>
    :root {
      --navy:  #193050;
      --bg:    #DFE2E8;
      --card:  #ffffff;
      --muted: rgba(25,48,80,0.65);
      --faint: rgba(25,48,80,0.10);
      --shadow: 0 2px 16px rgba(15,23,42,0.07);
      --tl-red:   #C0392B;
      --tl-amber: #D48C22;
      --tl-green: #1E7D4B;
    }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:"Open Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; background:var(--bg); color:var(--navy); font-size:13px; line-height:1.5; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page { max-width:880px; margin:0 auto; padding:24px 20px 40px; display:flex; flex-direction:column; gap:12px; }

    /* HEADER */
    .header { background:var(--navy); border-radius:18px; padding:26px 32px 26px; position:relative; overflow:hidden; display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
    .header::before { content:""; position:absolute; right:-50px; top:-50px; width:260px; height:260px; background:radial-gradient(circle,rgba(61,178,221,0.20) 0%,transparent 68%); border-radius:50%; pointer-events:none; }
    .header::after  { content:""; position:absolute; left:-30px; bottom:-40px; width:180px; height:180px; background:radial-gradient(circle,rgba(216,183,67,0.14) 0%,transparent 70%); border-radius:50%; pointer-events:none; }
    .header-left { position:relative; z-index:2; max-width:460px; }
    .header-brand { font-size:9.5px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:#3DB2DD; margin-bottom:6px; }
    .header-title { font-size:20px; font-weight:800; color:#fff; line-height:1.15; letter-spacing:-0.2px; }
    .header-sub { margin-top:6px; font-size:11.5px; color:rgba(255,255,255,0.50); }
    .header-accent { margin-top:16px; height:3px; width:160px; border-radius:99px; background:linear-gradient(90deg,#D8B743,#3DB2DD,#6BB790); }
    .header-right { position:relative; z-index:2; flex-shrink:0; text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:3px; }
    .header-company { font-size:14px; font-weight:700; color:#fff; }
    .header-meta { font-size:11px; color:rgba(255,255,255,0.50); }
    .score-block { margin-top:14px; display:flex; align-items:baseline; gap:6px; justify-content:flex-end; }
    .score-num { font-size:48px; font-weight:900; line-height:1; letter-spacing:-2px; }
    .score-den { font-size:14px; color:rgba(255,255,255,0.40); }
    .score-band { margin-top:6px; display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.16); border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; color:rgba(255,255,255,0.88); letter-spacing:0.03em; }
    .band-pip { width:7px; height:7px; border-radius:50%; }

    /* CARD */
    .card { background:var(--card); border-radius:16px; border:1px solid rgba(25,48,80,0.08); box-shadow:var(--shadow); overflow:hidden; }
    .card-head { padding:16px 22px 14px; border-bottom:1px solid var(--faint); display:flex; align-items:baseline; gap:10px; }
    .card-title { font-size:11px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:rgba(25,48,80,0.45); }
    .card-sub { font-size:12px; color:rgba(25,48,80,0.50); font-weight:400; }

    /* RADAR */
    .radar-full { padding:20px 22px 0; display:flex; justify-content:center; }
    .radar-img { width:100%; max-width:520px; height:auto; display:block; border-radius:8px; }

    /* PILLARS */
    .pillar-stat-grid { display:grid; grid-template-columns:repeat(5,1fr); border-top:1px solid var(--faint); margin-top:16px; }
    .pillar-stat { padding:16px 18px; border-right:1px solid var(--faint); display:flex; flex-direction:column; gap:6px; }
    .pillar-stat:last-child { border-right:none; }
    .ps-score { font-size:28px; font-weight:900; line-height:1; letter-spacing:-0.5px; }
    .ps-den { font-size:11px; font-weight:500; color:var(--muted); margin-left:1px; }
    .ps-band { display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:700; color:var(--navy); background:rgba(25,48,80,0.05); border:1px solid var(--faint); border-radius:99px; padding:2px 8px; width:fit-content; }
    .ps-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
    .ps-name { font-size:11px; font-weight:600; color:var(--navy); line-height:1.3; margin-top:2px; }
    .ps-desc { font-size:10.5px; color:var(--muted); line-height:1.45; }

    /* WATERFALL */
    .wf-row { display:grid; grid-template-columns:26px 1fr 1fr 96px; align-items:center; gap:0 14px; padding:12px 22px; border-top:1px solid var(--faint); }
    .wf-icon-col { display:flex; align-items:center; justify-content:center; }
    .wf-circle { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
    .wf-label { font-size:12.5px; font-weight:600; color:var(--navy); }
    .wf-desc  { font-size:11px; color:var(--muted); margin-top:2px; }
    .wf-bar-col { display:flex; align-items:center; }
    .wf-bar-track { flex:1; height:8px; background:rgba(25,48,80,0.07); border-radius:99px; overflow:hidden; }
    .wf-bar-fill { height:100%; border-radius:99px; }
    .wf-amount { font-size:14px; font-weight:800; text-align:right; white-space:nowrap; }
    .wf-summary-strip { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--faint); }
    .wf-stat { padding:14px 20px; border-right:1px solid var(--faint); }
    .wf-stat:last-child { border-right:none; }
    .wf-stat-lbl { font-size:9.5px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:rgba(25,48,80,0.45); margin-bottom:4px; }
    .wf-stat-val { font-size:20px; font-weight:900; color:var(--navy); line-height:1; }
    .wf-stat-val.loss { color:var(--tl-red); }

    /* QUAL GRID */
    .qual-grid { column-count:2; column-gap:0; }
    .qual-item { padding:18px 22px; border-top:1px solid var(--faint); break-inside:avoid; -webkit-column-break-inside:avoid; }
    .qual-head-row { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:8px; }
    .qual-pillar-label { font-size:9.5px; font-weight:700; letter-spacing:0.13em; text-transform:uppercase; color:var(--muted); margin-bottom:3px; }
    .qual-title { font-size:13px; font-weight:800; color:var(--navy); line-height:1.3; }
    .qual-score-pill { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
    .qual-score-num { font-size:20px; font-weight:900; line-height:1; }
    .qual-score-den { font-size:9.5px; color:var(--muted); margin-left:1px; }
    .qual-band-pill { display:inline-flex; align-items:center; gap:5px; border-radius:99px; padding:2px 8px; font-size:9.5px; font-weight:700; border:1px solid var(--faint); background:rgba(25,48,80,0.03); white-space:nowrap; }
    .q-dot { width:5px; height:5px; border-radius:50%; }
    .qual-body { font-size:12px; color:var(--muted); line-height:1.65; }

    /* SOLUTIONS */
    .solutions-grid { display:flex; flex-direction:column; gap:12px; }
    .sol-card { border:1px solid var(--faint); border-radius:14px; padding:18px 22px; background:rgba(25,48,80,0.015); page-break-inside:avoid; break-inside:avoid; }
    .sol-tag { display:inline-block; font-size:9px; font-weight:700; letter-spacing:0.10em; text-transform:uppercase; color:#3DB2DD; background:rgba(61,178,221,0.08); border:1px solid rgba(61,178,221,0.18); border-radius:99px; padding:2px 10px; margin-bottom:8px; }
    .sol-title { font-size:14px; font-weight:800; color:var(--navy); margin-bottom:8px; line-height:1.3; }
    .sol-bullets { list-style:none; padding:0; margin:0; }
    .sol-bullets li { font-size:12px; color:var(--muted); line-height:1.55; padding:3px 0 3px 16px; position:relative; }
    .sol-bullets li::before { content:""; position:absolute; left:0; top:10px; width:6px; height:6px; border-radius:50%; background:#D8B743; }

    .pillar-row, .wf-row, .qual-item { page-break-inside:avoid; break-inside:avoid; }
    @page { margin:20px; }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-left">
      <div class="header-brand">HumTech.ai</div>
      <div class="header-title">AI & Operations Maturity Scorecard</div>
      <div class="header-sub">A diagnostic snapshot of revenue leakage, operational drag, and AI readiness across your business.</div>
      <div class="header-accent"></div>
    </div>
    <div class="header-right">
      <div class="header-company">${company}</div>
      <div class="header-meta">${email}</div>
      <div class="header-meta">${submitted}</div>
      <div class="score-block">
        <span class="score-num" style="color:${overallColor};">${overallDisplay}</span>
        <span class="score-den">/ 10</span>
      </div>
      <div class="score-band">
        <span class="band-pip" style="background:${overallColor};"></span>
        ${overallBand}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <span class="card-title">Your Operating Shape</span>
      <span class="card-sub">Five pillars that drive revenue capture and operational efficiency</span>
    </div>
    <div class="radar-full">
      ${radarUrl
        ? `<img class="radar-img" src="${radarUrl}" alt="Radar chart" />`
        : `<div style="width:100%;max-width:520px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px;border:1px dashed var(--faint);border-radius:8px;margin:0 auto;">Radar chart unavailable</div>`}
    </div>
    <div class="pillar-stat-grid">
      ${pillarRowsHtml}
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <span class="card-title">Revenue Waterfall</span>
      <span class="card-sub">Recoverable revenue based on industry-standard conversion benchmarks</span>
    </div>
    ${wfRowsHtml}
    <div class="wf-summary-strip">
      <div class="wf-stat">
        <div class="wf-stat-lbl">Annual Recoverable Revenue</div>
        <div class="wf-stat-val loss">${money(totalLoss)}</div>
      </div>
      <div class="wf-stat">
        <div class="wf-stat-lbl">Capture Rate</div>
        <div class="wf-stat-val">${pct(wf.captureRatePercent)}</div>
      </div>
      <div class="wf-stat">
        <div class="wf-stat-lbl">Biggest Leak Stage</div>
        <div class="wf-stat-val" style="font-size:16px;">${stg(wf.biggestLeakStage)}</div>
      </div>
    </div>
    <div style="padding:10px 22px 14px;"><div style="background:rgba(25,48,80,0.04);border:1px solid var(--faint);border-radius:8px;padding:10px 14px;font-size:10.5px;color:var(--muted);line-height:1.4;">These figures represent recoverable revenue based on industry-standard conversion benchmarks of 70% booking, 85% attendance, and 50% conversion.${wf.anyFallback ? ' Some input figures use industry averages as exact data was not provided.' : ''}</div></div>
  </div>

  <div class="card">
    <div class="card-head">
      <span class="card-title">What This Means</span>
      <span class="card-sub">Pillar insights translated into commercial impact</span>
    </div>
    <div class="qual-grid">
      ${qualCardsHtml}
    </div>
  </div>

  ${solutionSectionHtml}

</div>
</body>
</html>`;

return [{ json: { source: html } }];
"""


def main():
    print("1. Fetching current workflow...")
    wf = api("GET", f"/api/v1/workflows/{WORKFLOW_ID}")
    print(f"   Got: {wf['name']} ({len(wf['nodes'])} nodes)")

    updated = []
    for node in wf["nodes"]:
        name = node["name"]

        if name == "Revenue Waterfall / Qualification":
            print(f"2. Updating: {name} (adding solution selection)")
            node["parameters"]["jsCode"] = REVENUE_WATERFALL_CODE
            updated.append(name)

        elif name == "Build PDF HTML":
            print(f"3. Updating: {name} (adding solution cards)")
            node["parameters"]["jsCode"] = BUILD_PDF_HTML_CODE
            updated.append(name)

    if not updated:
        print("ERROR: No nodes matched!")
        return

    # Build minimal PUT payload
    update = {
        "name": wf["name"],
        "nodes": wf["nodes"],
        "connections": wf["connections"],
        "settings": {
            "executionOrder": wf.get("settings", {}).get("executionOrder", "v1"),
            "timezone": wf.get("settings", {}).get("timezone", "Europe/London"),
        },
    }

    print(f"4. Pushing updated workflow ({len(updated)} nodes changed)...")
    result = api("PUT", f"/api/v1/workflows/{WORKFLOW_ID}", update)
    print(f"   Success! Version: {result.get('versionId', '?')}")
    print(f"   Updated: {', '.join(updated)}")


if __name__ == "__main__":
    main()
