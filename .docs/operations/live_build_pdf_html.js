const input = $input.first().json;

const company   = input.company_name || input.company || "Your Company";
const email     = input.email || "—";
const rawDate = input.submitted_at || input.submitted || new Date().toISOString();
const submittedDate = new Date(rawDate);
const submitted = submittedDate instanceof Date && !isNaN(submittedDate)
  ? String(submittedDate.getDate()).padStart(2,'0') + '-' + String(submittedDate.getMonth()+1).padStart(2,'0') + '-' + String(submittedDate.getFullYear()).slice(-2)
  : rawDate;
const radarUrl  = input.radarUrl || input.radar_url || "";

const overallScore =
  input.scoring?.overall?.score10 ?? input.overall_score ?? input.overallScore ?? "—";
const overallBand  =
  input.banding?.overallBand?.bandLabel ?? input.scoring?.overall?.maturityBand ??
  input.overall_band_label ?? input.overallBandLabel ?? "—";

const wf     = input.revenueWaterfall || {};
const money  = (n) => typeof n === "number" ? `£${Math.round(n).toLocaleString()}` : "N/A";
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

// CHANGED: "adequate" → "average" to match banding node output
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
  const band    = pillarInsights[k]?.bandLabel ?? "—";
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
const maxVal   = Math.max(pipeline, 1);
const bar      = (v) => Math.min(100, Math.max(2, (v / maxVal) * 100));

const wfRowsHtml = [
  { label:"Lost at engagement",      desc:"Leads that never book",             val:`−${money(engLoss)}`,  amount:`−${money(engLoss)}`,  type:"loss",   barW:bar(engLoss)  },
  { label:"Lost at attendance",      desc:"Booked but didn’t show",      val:`−${money(attLoss)}`,  amount:`−${money(attLoss)}`,  type:"loss",   barW:bar(attLoss)  },
  { label:"Lost at conversion",      desc:"Showed but didn’t transact",  val:`−${money(convLoss)}`, amount:`−${money(convLoss)}`, type:"loss",   barW:bar(convLoss) },
].map(r => {
  const ic = r.type === "source" ? {bg:"rgba(25,48,80,0.10)",c:"var(--navy)",sym:"→"}
           : r.type === "loss"   ? {bg:"rgba(192,57,43,0.10)", c:"#C0392B",sym:"↘"}
           :                       {bg:"rgba(25,48,80,0.10)",  c:"var(--navy)",sym:"→"};
  const barColor = r.type === "loss" ? "#C0392B" : "rgba(25,48,80,0.25)";
  const amtColor = r.type === "loss" ? "#C0392B" : "var(--navy)";
  return `
    <div class="wf-row">
      <div class="wf-icon-col">
        <div class="wf-circle" style="background:${ic.bg};color:${ic.c};">${ic.sym}</div>
      </div>
      <div>
        <div class="wf-label">${r.label}</div>
        ${r.desc ? `<div class="wf-desc">${r.desc}</div>` : ""}
      </div>
      <div class="wf-bar-col">
        <div class="wf-bar-track"><div class="wf-bar-fill" style="width:${r.barW}%;background:${barColor};"></div></div>
      </div>
      <div class="wf-amount" style="color:${amtColor};">${r.amount}</div>
    </div>`;
}).join("");

// CHANGED: Qual cards — removed special 5th-item grid span handling
const qualCardsHtml = PILLAR_ORDER.map((k) => {
  const label = pillarInsights[k]?.pillarLabel ?? PILLAR_LABELS[k] ?? k;
  const band  = pillarInsights[k]?.bandLabel ?? "—";
  const score = pillarInsights[k]?.score ?? pillarScores[k] ?? 0;
  const title = pillarInsights[k]?.title ?? "—";
  const body  = pillarInsights[k]?.body  ?? "—";
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

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <title>HumTech — ${company}</title>
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

    /* CHANGED: QUAL GRID — newspaper column layout */
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
      <span class="card-sub">Annual revenue loss from current sales conversion strategy</span>
    </div>
    ${wfRowsHtml}
    <div class="wf-summary-strip">
      <div class="wf-stat">
        <div class="wf-stat-lbl">Annual Revenue Loss</div>
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
    ${wf.anyFallback ? '<div style="padding:10px 22px 14px;"><div style="background:#FFF8E1;border:1px solid #F0D76E;border-radius:8px;padding:10px 14px;font-size:10.5px;color:#5D4E00;line-height:1.4;"><strong>Note:</strong> Some figures use industry averages as exact data was not provided. These results are illustrative.</div></div>' : ''}
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

</div>
</body>
</html>`;

return [{ json: { source: html } }];
