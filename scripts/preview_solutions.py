"""
Generate a local HTML preview of the scorecard results with solution cards.
Uses Chris's test data from execution 48482.

Usage: python -X utf8 scripts/preview_solutions.py
Opens the result in your default browser.
"""
import json
import os
import webbrowser
import tempfile

# ── Simulate Chris's test submission data ──
INPUT = {
    "company_name": "Chris Test Co",
    "email": "chris@test.com",
    "submitted_at": "2026-03-03T14:22:22.985Z",
    "radarUrl": "",
    "scoring": {
        "overall": {"score10": 4.2, "maturityBand": "Critical"},
        "pillars": {
            "leadEngagementSpeed": 4.0,
            "appointmentReliabilityConversion": 2.0,
            "operationalFocusTimeEfficiency": 5.0,
            "systemsAutomationMaturity": 4.8,
            "revenueProtectionLeakageControl": 3.6,
        },
        "radar": {
            "leadEngagementSpeed": 4.0,
            "appointmentReliabilityConversion": 2.0,
            "operationalFocusTimeEfficiency": 5.0,
            "systemsAutomationMaturity": 4.8,
            "revenueProtectionLeakageControl": 3.6,
        },
    },
    "banding": {
        "overallBand": {"bandLabel": "Critical"},
    },
    "pillarInsights": {
        "leadEngagementSpeed": {
            "pillarLabel": "Lead Engagement & Efficacy",
            "score": 4.0,
            "bandLabel": "Critical",
            "bandMeaning": "Poor lead engagement",
            "title": "Significant revenue leakage at first contact",
            "body": "Your lead engagement processes are leaving significant revenue on the table. Response times and engagement methods need urgent attention.",
        },
        "appointmentReliabilityConversion": {
            "pillarLabel": "Appointment Reliability & Conversion",
            "score": 2.0,
            "bandLabel": "Critical",
            "bandMeaning": "Very low appointment reliability",
            "title": "Appointment attendance is critically low",
            "body": "A large proportion of booked appointments are not converting to attended meetings, representing a major bottleneck in your revenue pipeline.",
        },
        "operationalFocusTimeEfficiency": {
            "pillarLabel": "Operational Focus & Time Efficiency",
            "score": 5.0,
            "bandLabel": "Action Required",
            "bandMeaning": "Below average operational efficiency",
            "title": "Staff time allocation needs improvement",
            "body": "Your team is spending too much time on non-revenue generating activities. Process automation could free up significant capacity.",
        },
        "systemsAutomationMaturity": {
            "pillarLabel": "Systems & Automation Maturity",
            "score": 4.8,
            "bandLabel": "Critical",
            "bandMeaning": "Low automation maturity",
            "title": "Manual processes dominate operations",
            "body": "Most processes remain manual, creating bottlenecks and limiting scalability. Automation infrastructure is needed across key business functions.",
        },
        "revenueProtectionLeakageControl": {
            "pillarLabel": "Revenue Protection & Leakage Control",
            "score": 3.6,
            "bandLabel": "Critical",
            "bandMeaning": "High revenue leakage",
            "title": "Revenue is leaking at multiple stages",
            "body": "Without systematic tracking and intervention at each pipeline stage, revenue opportunities are being lost throughout the funnel.",
        },
    },
    "revenueWaterfall": {
        "version": "v3",
        "anyFallback": False,
        "pipeline": 36000000,
        "engagementLoss": 21600000,
        "attendanceLoss": 12960000,
        "conversionLoss": 1368000,
        "closedValue": 72000,
        "totalLoss": 35928000,
        "captureRatePercent": 0.2,
        "biggestLeakStage": "engagement",
        "biggestLeakLabel": "Engagement",
    },
    # Raw answers to trigger solution selection
    "rawAnswers": {
        "q5_repetitive_manual_processes": "D",  # 80%+ → triggers operational
        "q8_non_revenue_time": "D",              # 5h+/week → triggers operational
        "q11_documents_and_signatures": "C",     # manual email → triggers documents
    },
    "numericAnswers": {
        "q4_show_rate": {"value": 40, "isFallback": False},
        "q_attendance_rate": {"value": 10, "isFallback": False},
        "q_transaction_rate": {"value": 5, "isFallback": False},
        "q_deal_value": {"value": 6000, "isFallback": False},
        "q_lead_volume": {"value": 500, "isFallback": False},
    },
}


BENCHMARKS = {"bookingRate": 70, "attendanceRate": 85, "conversionRate": 50}


def recalculate_waterfall_benchmark(input_data):
    """Recalculate waterfall using benchmark-based gap model (matches n8n v4)."""
    na = input_data.get("numericAnswers", {})
    total_leads = na["q_lead_volume"]["value"]
    deal_value = na["q_deal_value"]["value"]
    book_pct = na["q4_show_rate"]["value"] / 100
    show_pct = na["q_attendance_rate"]["value"] / 100
    convert_pct = na["q_transaction_rate"]["value"] / 100

    leads_that_book = total_leads * book_pct
    leads_that_show = leads_that_book * show_pct
    leads_that_convert = leads_that_show * convert_pct

    eng_gap = max(0, BENCHMARKS["bookingRate"] - na["q4_show_rate"]["value"]) / 100
    att_gap = max(0, BENCHMARKS["attendanceRate"] - na["q_attendance_rate"]["value"]) / 100
    conv_gap = max(0, BENCHMARKS["conversionRate"] - na["q_transaction_rate"]["value"]) / 100

    eng_loss = total_leads * eng_gap * deal_value
    att_loss = leads_that_book * att_gap * deal_value
    conv_loss = leads_that_show * conv_gap * deal_value
    total_loss = eng_loss + att_loss + conv_loss

    pipeline = total_leads * deal_value
    closed = leads_that_convert * deal_value
    capture = (closed / pipeline * 100) if pipeline > 0 else 0

    leaks = sorted([
        ("engagement", eng_loss), ("attendance", att_loss), ("conversion", conv_loss)
    ], key=lambda x: x[1], reverse=True)

    return {
        "version": "v4",
        "benchmarks": BENCHMARKS,
        "anyFallback": False,
        "inputs": {
            "bookingRatePct": {"value": na["q4_show_rate"]["value"]},
            "attendanceRatePct": {"value": na["q_attendance_rate"]["value"]},
            "conversionRatePct": {"value": na["q_transaction_rate"]["value"]},
        },
        "pipeline": round(pipeline * 12),
        "engagementLoss": round(eng_loss * 12),
        "attendanceLoss": round(att_loss * 12),
        "conversionLoss": round(conv_loss * 12),
        "closedValue": round(closed * 12),
        "totalLoss": round(total_loss * 12),
        "captureRatePercent": round(capture * 10) / 10,
        "biggestLeakStage": leaks[0][0],
        "biggestLeakLabel": leaks[0][0].capitalize(),
    }


def run_solution_selection(input_data):
    """Replicate the solution selection logic from the Revenue Waterfall node."""
    wf = input_data["revenueWaterfall"]
    raw = input_data.get("rawAnswers", {})

    SOLUTIONS = {
        "engagement": {
            "tag": "Revenue Recovery",
            "title": "Low Booking Rates Are Wasting Your Lead Investment",
            "bullets": [
                "Unless you currently utilise multivariate testing and conversion modules integrated into your client software, you will be wasting a significant portion of your budget on acquiring low intent, poorly qualified leads. Ensure the system you\u2019re using is sufficiently advanced to utilise data from your CRM to continually refine your pixel/data set.",
                "Most companies don\u2019t employ necessary psychological principles on their websites, landers or data capture vehicles to ensure maximum appointment attendance. If your lead capture form only collects contact information, this will attenuate lead quality.",
                "AI methodologies are outperforming non-AI informed paid outreach systems in the production of high performing creatives. It\u2019s important to stay ahead of the curve here as competitors will be adopting these strategies.",
            ],
        },
        "attendance": {
            "tag": "Revenue Recovery",
            "title": "High No-Show Rates Are Draining Sales Capacity",
            "bullets": [
                "If you are currently receiving leads without automated conversational appointment booking and an appropriate follow up sequence you will almost certainly have poorer attendance. Review your \u2018client touch point journey\u2019 and automate this process to improve show up rates without additional resource requirements.",
                "Most companies don\u2019t employ necessary psychological principles on their websites, landers or data capture vehicles. Copy changes and form integrations which enhance the lead mindset and starting dynamic are a relatively quick fix.",
                "Ensure the system you\u2019re using is sufficiently advanced to utilise data from your CRM to continually refine your pixel/data set. AI methodologies are outperforming non-AI informed paid outreach systems in the production of high performing creatives.",
            ],
        },
        "conversion": {
            "tag": "Revenue Recovery",
            "title": "Close More Deals Post-Meeting",
            "bullets": [
                "Automated post-meeting follow-up sequences that maintain momentum through the decision window",
                "Systematic close process that removes reliance on individual sales performance",
                "Pipeline tracking and AI re-engagement for stalled opportunities",
            ],
        },
        "operational": {
            "tag": "Operational Efficiency",
            "title": "Too Much Time is Spent on Non-Core Work",
            "bullets": [
                "It is possible to automate approx. 70% of manual tasks in most businesses within a few weeks. Your staff should not be performing any manual repetitive tasks. A single action on your CRM automatically updates all associated business outcomes \u2014 relevant software, spreadsheets, financial reporting, sends communications or calls the client. Like a ripple in a pond, a single 3 second action accounts for the work of several staff members.",
                "Your team should not be spending time attempting to engage colder leads or old data sets. This is a thankless task which impacts morale negatively. AI can comb and engage existing data to liberate trapped revenue without burdening staff.",
                "Core work differs between businesses, even in the same industry. It\u2019s useful to have a third party assess all areas of your business (sales/finance/compliance/client services) to suggest a comprehensive list of time deflection solutions. You will be surprised at the impact that custom-made departmental interventions have on morale, performance and sick days.",
            ],
        },
        "documents": {
            "tag": "Compliance & Documents",
            "title": "Secure, Automated Document Handling",
            "bullets": [
                "If your business sends or receives documents such as compliance or AML, it is of paramount importance that you request documents and/or signatures via an online portal with a UK data centre. If you presently use a third party service, check that their data is stored in the UK \u2014 if not, you are not presently UK GDPR compliant.",
                "Document requests should be automated and chasing left to AI. Most third-party document request systems are not compliant and lack personal branding \u2014 sending a link which displays \u2018DocuSign\u2019 branding delivers much lower adherence than a portal with your company branding which you own and control fully.",
                "We predict potential future ICO infringement cases on the basis of improper collection and storage of personal data \u2014 this is especially important if you collect any \u2018special category\u2019 data.",
            ],
        },
    }

    biggest_stage = wf["biggestLeakStage"]
    eng_loss = wf["engagementLoss"]
    att_loss = wf["attendanceLoss"]
    conv_loss = wf["conversionLoss"]
    total_loss = wf["totalLoss"]

    candidates = []

    # Category 1: Biggest leak (priority 10)
    if biggest_stage in SOLUTIONS:
        candidates.append({**SOLUTIONS[biggest_stage], "priority": 10})

    # Category 1b: Second-biggest leak if >30% of total loss
    leaks = sorted(
        [("engagement", eng_loss), ("attendance", att_loss), ("conversion", conv_loss)],
        key=lambda x: x[1],
        reverse=True,
    )
    if len(leaks) >= 2 and total_loss > 0:
        second = leaks[1]
        if second[1] / total_loss > 0.30 and second[0] != biggest_stage:
            candidates.append({**SOLUTIONS[second[0]], "priority": 7})

    # Category 2: Operational
    q5 = raw.get("q5_repetitive_manual_processes", "")
    q8 = raw.get("q8_non_revenue_time", "")
    ops_priority = (4 if q5 in ("D", "E") else 0) + (4 if q8 in ("D", "E") else 0)
    if ops_priority > 0:
        candidates.append({**SOLUTIONS["operational"], "priority": ops_priority})

    # Category 3: Documents
    q11 = raw.get("q11_documents_and_signatures", "")
    if q11 == "C":
        candidates.append({**SOLUTIONS["documents"], "priority": 6})
    elif q11 == "E":
        candidates.append({**SOLUTIONS["documents"], "priority": 5})

    candidates.sort(key=lambda x: x["priority"], reverse=True)
    return candidates[:3]


def generate_html(input_data, solutions):
    """Replicate the Build PDF HTML node output."""
    company = input_data.get("company_name", "Your Company")
    email = input_data.get("email", "—")
    submitted = "03-03-26"
    radar_url = input_data.get("radarUrl", "")

    scoring = input_data.get("scoring", {})
    overall_score = scoring.get("overall", {}).get("score10", "—")
    overall_band = input_data.get("banding", {}).get("overallBand", {}).get("bandLabel", "—")

    wf = input_data.get("revenueWaterfall", {})
    pillar_insights = input_data.get("pillarInsights", {})
    pillar_scores = scoring.get("pillars", {})

    def money(n):
        if not isinstance(n, (int, float)):
            return "N/A"
        return f"£{round(n):,}"

    def pct(n):
        return f"{n}%" if isinstance(n, (int, float)) else "N/A"

    def stg(s):
        return s[0].upper() + s[1:] if s else "N/A"

    TL = {
        "critical": "#C0392B",
        "action required": "#C0392B",
        "average": "#D48C22",
        "optimised": "#1E7D4B",
    }

    def tl(b):
        return TL.get(str(b or "").lower().strip(), "#D48C22")

    overall_color = tl(overall_band)
    overall_display = f"{overall_score:.1f}" if isinstance(overall_score, (int, float)) else overall_score

    PILLAR_ORDER = [
        "leadEngagementSpeed",
        "appointmentReliabilityConversion",
        "operationalFocusTimeEfficiency",
        "systemsAutomationMaturity",
        "revenueProtectionLeakageControl",
    ]
    PILLAR_LABELS = {
        "leadEngagementSpeed": "Lead Engagement & Efficacy",
        "appointmentReliabilityConversion": "Appointment Reliability & Conversion",
        "operationalFocusTimeEfficiency": "Operational Focus & Time Efficiency",
        "systemsAutomationMaturity": "Systems & Automation Maturity",
        "revenueProtectionLeakageControl": "Revenue Protection & Leakage Control",
    }

    # Pillar stat cards
    pillar_rows = []
    for k in PILLAR_ORDER:
        pi = pillar_insights.get(k, {})
        score = pi.get("score", pillar_scores.get(k, 0))
        band = pi.get("bandLabel", "—")
        label = pi.get("pillarLabel", PILLAR_LABELS.get(k, k))
        desc = pi.get("bandMeaning", "")
        c = tl(band)
        pillar_rows.append(f"""
    <div class="pillar-stat">
      <div class="ps-score" style="color:{c};">{score:.1f}<span class="ps-den">/10</span></div>
      <div class="ps-band"><span class="ps-dot" style="background:{c};"></span>{band}</div>
      <div class="ps-name">{label}</div>
      {f'<div class="ps-desc">{desc}</div>' if desc else ""}
    </div>""")
    pillar_rows_html = "".join(pillar_rows)

    # Waterfall (benchmark-based)
    eng_loss = wf.get("engagementLoss", 0)
    att_loss = wf.get("attendanceLoss", 0)
    conv_loss = wf.get("conversionLoss", 0)
    total_loss = wf.get("totalLoss", 0)
    bm = wf.get("benchmarks", BENCHMARKS)
    inputs = wf.get("inputs", {})
    max_val = max(max(eng_loss, att_loss, conv_loss), 1)

    def bar(v):
        return min(100, max(2, (v / max_val) * 100))

    wf_rows_data = [
        ("Engagement gap", inputs.get("bookingRatePct", {}).get("value", "?"), bm["bookingRate"], eng_loss),
        ("Attendance gap", inputs.get("attendanceRatePct", {}).get("value", "?"), bm["attendanceRate"], att_loss),
        ("Conversion gap", inputs.get("conversionRatePct", {}).get("value", "?"), bm["conversionRate"], conv_loss),
    ]
    wf_rows = []
    for label, your_rate, bm_rate, loss in wf_rows_data:
        above = loss == 0
        desc = f"Your rate: {your_rate}% \u00b7 At or above benchmark ({bm_rate}%)" if above else f"Your rate: {your_rate}% \u00b7 Benchmark: {bm_rate}%"
        if above:
            icon_bg, icon_c, icon_sym = "rgba(30,125,75,0.10)", "#1E7D4B", "\u2713"
            bar_color, amt_color, amt_text = "#1E7D4B", "#1E7D4B", "\u2014"
            bar_w = 2
        else:
            icon_bg, icon_c, icon_sym = "rgba(192,57,43,0.10)", "#C0392B", "\u2198"
            bar_color, amt_color, amt_text = "#C0392B", "#C0392B", f"\u2212{money(loss)}"
            bar_w = bar(loss)
        wf_rows.append(f"""
    <div class="wf-row">
      <div class="wf-icon-col"><div class="wf-circle" style="background:{icon_bg};color:{icon_c};">{icon_sym}</div></div>
      <div><div class="wf-label">{label}</div><div class="wf-desc">{desc}</div></div>
      <div class="wf-bar-col"><div class="wf-bar-track"><div class="wf-bar-fill" style="width:{bar_w:.0f}%;background:{bar_color};"></div></div></div>
      <div class="wf-amount" style="color:{amt_color};">{amt_text}</div>
    </div>""")
    wf_rows_html = "".join(wf_rows)

    # Qual cards
    qual_cards = []
    for k in PILLAR_ORDER:
        pi = pillar_insights.get(k, {})
        label = pi.get("pillarLabel", PILLAR_LABELS.get(k, k))
        band = pi.get("bandLabel", "—")
        score = pi.get("score", pillar_scores.get(k, 0))
        title = pi.get("title", "—")
        body = pi.get("body", "—")
        c = tl(band)
        qual_cards.append(f"""
    <div class="qual-item">
      <div class="qual-head-row">
        <div>
          <div class="qual-pillar-label">{label}</div>
          <div class="qual-title">{title}</div>
        </div>
        <div class="qual-score-pill">
          <div class="qual-score-num" style="color:{c};">{score:.1f}<span class="qual-score-den">/10</span></div>
          <div class="qual-band-pill"><span class="q-dot" style="background:{c};"></span>{band}</div>
        </div>
      </div>
      <div class="qual-body">{body}</div>
    </div>""")
    qual_cards_html = "".join(qual_cards)

    # Solution cards
    sol_cards = ""
    if solutions:
        cards = []
        for sol in solutions:
            bullets_html = "".join(f"<li>{b}</li>" for b in sol["bullets"])
            cards.append(f"""
      <div class="sol-card">
        <div class="sol-tag">{sol['tag']}</div>
        <div class="sol-title">{sol['title']}</div>
        <ul class="sol-bullets">{bullets_html}</ul>
      </div>""")
        sol_cards = f"""
  <div class="card">
    <div class="card-head">
      <span class="card-title">Recommended Solutions</span>
      <span class="card-sub">Based on your specific assessment results</span>
    </div>
    <div style="padding:16px 22px;">
      <div class="solutions-grid">
        {"".join(cards)}
      </div>
    </div>
  </div>"""

    fallback_note = " Some input figures use industry averages as exact data was not provided." if wf.get("anyFallback") else ""
    disclaimer = f'<div style="padding:10px 22px 14px;"><div style="background:rgba(25,48,80,0.04);border:1px solid rgba(25,48,80,0.10);border-radius:8px;padding:10px 14px;font-size:10.5px;color:rgba(25,48,80,0.65);line-height:1.4;">These figures represent recoverable revenue based on industry-standard conversion benchmarks of 70% booking, 85% attendance, and 50% conversion.{fallback_note}</div></div>'

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <title>HumTech — {company}</title>
  <style>
    :root {{
      --navy:  #193050;
      --bg:    #DFE2E8;
      --card:  #ffffff;
      --muted: rgba(25,48,80,0.65);
      --faint: rgba(25,48,80,0.10);
      --shadow: 0 2px 16px rgba(15,23,42,0.07);
      --tl-red:   #C0392B;
      --tl-amber: #D48C22;
      --tl-green: #1E7D4B;
    }}
    * {{ box-sizing:border-box; margin:0; padding:0; }}
    body {{ font-family:"Open Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; background:var(--bg); color:var(--navy); font-size:13px; line-height:1.5; }}
    .page {{ max-width:880px; margin:0 auto; padding:24px 20px 40px; display:flex; flex-direction:column; gap:12px; }}
    .header {{ background:var(--navy); border-radius:18px; padding:26px 32px 26px; position:relative; overflow:hidden; display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }}
    .header::before {{ content:""; position:absolute; right:-50px; top:-50px; width:260px; height:260px; background:radial-gradient(circle,rgba(61,178,221,0.20) 0%,transparent 68%); border-radius:50%; pointer-events:none; }}
    .header::after  {{ content:""; position:absolute; left:-30px; bottom:-40px; width:180px; height:180px; background:radial-gradient(circle,rgba(216,183,67,0.14) 0%,transparent 70%); border-radius:50%; pointer-events:none; }}
    .header-left {{ position:relative; z-index:2; max-width:460px; }}
    .header-brand {{ font-size:9.5px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:#3DB2DD; margin-bottom:6px; }}
    .header-title {{ font-size:20px; font-weight:800; color:#fff; line-height:1.15; letter-spacing:-0.2px; }}
    .header-sub {{ margin-top:6px; font-size:11.5px; color:rgba(255,255,255,0.50); }}
    .header-accent {{ margin-top:16px; height:3px; width:160px; border-radius:99px; background:linear-gradient(90deg,#D8B743,#3DB2DD,#6BB790); }}
    .header-right {{ position:relative; z-index:2; flex-shrink:0; text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:3px; }}
    .header-company {{ font-size:14px; font-weight:700; color:#fff; }}
    .header-meta {{ font-size:11px; color:rgba(255,255,255,0.50); }}
    .score-block {{ margin-top:14px; display:flex; align-items:baseline; gap:6px; justify-content:flex-end; }}
    .score-num {{ font-size:48px; font-weight:900; line-height:1; letter-spacing:-2px; }}
    .score-den {{ font-size:14px; color:rgba(255,255,255,0.40); }}
    .score-band {{ margin-top:6px; display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.16); border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; color:rgba(255,255,255,0.88); letter-spacing:0.03em; }}
    .band-pip {{ width:7px; height:7px; border-radius:50%; }}
    .card {{ background:var(--card); border-radius:16px; border:1px solid rgba(25,48,80,0.08); box-shadow:var(--shadow); overflow:hidden; }}
    .card-head {{ padding:16px 22px 14px; border-bottom:1px solid var(--faint); display:flex; align-items:baseline; gap:10px; }}
    .card-title {{ font-size:11px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:rgba(25,48,80,0.45); }}
    .card-sub {{ font-size:12px; color:rgba(25,48,80,0.50); font-weight:400; }}
    .radar-full {{ padding:20px 22px 0; display:flex; justify-content:center; }}
    .radar-img {{ width:100%; max-width:520px; height:auto; display:block; border-radius:8px; }}
    .pillar-stat-grid {{ display:grid; grid-template-columns:repeat(5,1fr); border-top:1px solid var(--faint); margin-top:16px; }}
    .pillar-stat {{ padding:16px 18px; border-right:1px solid var(--faint); display:flex; flex-direction:column; gap:6px; }}
    .pillar-stat:last-child {{ border-right:none; }}
    .ps-score {{ font-size:28px; font-weight:900; line-height:1; letter-spacing:-0.5px; }}
    .ps-den {{ font-size:11px; font-weight:500; color:var(--muted); margin-left:1px; }}
    .ps-band {{ display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:700; color:var(--navy); background:rgba(25,48,80,0.05); border:1px solid var(--faint); border-radius:99px; padding:2px 8px; width:fit-content; }}
    .ps-dot {{ width:5px; height:5px; border-radius:50%; flex-shrink:0; }}
    .ps-name {{ font-size:11px; font-weight:600; color:var(--navy); line-height:1.3; margin-top:2px; }}
    .ps-desc {{ font-size:10.5px; color:var(--muted); line-height:1.45; }}
    .wf-row {{ display:grid; grid-template-columns:26px 1fr 1fr 96px; align-items:center; gap:0 14px; padding:12px 22px; border-top:1px solid var(--faint); }}
    .wf-icon-col {{ display:flex; align-items:center; justify-content:center; }}
    .wf-circle {{ width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }}
    .wf-label {{ font-size:12.5px; font-weight:600; color:var(--navy); }}
    .wf-desc  {{ font-size:11px; color:var(--muted); margin-top:2px; }}
    .wf-bar-col {{ display:flex; align-items:center; }}
    .wf-bar-track {{ flex:1; height:8px; background:rgba(25,48,80,0.07); border-radius:99px; overflow:hidden; }}
    .wf-bar-fill {{ height:100%; border-radius:99px; }}
    .wf-amount {{ font-size:14px; font-weight:800; text-align:right; white-space:nowrap; }}
    .wf-summary-strip {{ display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--faint); }}
    .wf-stat {{ padding:14px 20px; border-right:1px solid var(--faint); }}
    .wf-stat:last-child {{ border-right:none; }}
    .wf-stat-lbl {{ font-size:9.5px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:rgba(25,48,80,0.45); margin-bottom:4px; }}
    .wf-stat-val {{ font-size:20px; font-weight:900; color:var(--navy); line-height:1; }}
    .wf-stat-val.loss {{ color:var(--tl-red); }}
    .qual-grid {{ column-count:2; column-gap:0; }}
    .qual-item {{ padding:18px 22px; border-top:1px solid var(--faint); break-inside:avoid; }}
    .qual-head-row {{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:8px; }}
    .qual-pillar-label {{ font-size:9.5px; font-weight:700; letter-spacing:0.13em; text-transform:uppercase; color:var(--muted); margin-bottom:3px; }}
    .qual-title {{ font-size:13px; font-weight:800; color:var(--navy); line-height:1.3; }}
    .qual-score-pill {{ display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }}
    .qual-score-num {{ font-size:20px; font-weight:900; line-height:1; }}
    .qual-score-den {{ font-size:9.5px; color:var(--muted); margin-left:1px; }}
    .qual-band-pill {{ display:inline-flex; align-items:center; gap:5px; border-radius:99px; padding:2px 8px; font-size:9.5px; font-weight:700; border:1px solid var(--faint); background:rgba(25,48,80,0.03); white-space:nowrap; }}
    .q-dot {{ width:5px; height:5px; border-radius:50%; }}
    .qual-body {{ font-size:12px; color:var(--muted); line-height:1.65; }}
    /* SOLUTIONS */
    .solutions-grid {{ display:flex; flex-direction:column; gap:12px; }}
    .sol-card {{ border:1px solid var(--faint); border-radius:14px; padding:18px 22px; background:rgba(25,48,80,0.015); }}
    .sol-tag {{ display:inline-block; font-size:9px; font-weight:700; letter-spacing:0.10em; text-transform:uppercase; color:#3DB2DD; background:rgba(61,178,221,0.08); border:1px solid rgba(61,178,221,0.18); border-radius:99px; padding:2px 10px; margin-bottom:8px; }}
    .sol-title {{ font-size:14px; font-weight:800; color:var(--navy); margin-bottom:8px; line-height:1.3; }}
    .sol-bullets {{ list-style:none; padding:0; margin:0; }}
    .sol-bullets li {{ font-size:12px; color:var(--muted); line-height:1.55; padding:3px 0 3px 16px; position:relative; }}
    .sol-bullets li::before {{ content:""; position:absolute; left:0; top:10px; width:6px; height:6px; border-radius:50%; background:#D8B743; }}
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
      <div class="header-company">{company}</div>
      <div class="header-meta">{email}</div>
      <div class="header-meta">{submitted}</div>
      <div class="score-block">
        <span class="score-num" style="color:{overall_color};">{overall_display}</span>
        <span class="score-den">/ 10</span>
      </div>
      <div class="score-band">
        <span class="band-pip" style="background:{overall_color};"></span>
        {overall_band}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <span class="card-title">Your Operating Shape</span>
      <span class="card-sub">Five pillars that drive revenue capture and operational efficiency</span>
    </div>
    <div class="radar-full">
      <div style="width:100%;max-width:520px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px;border:1px dashed var(--faint);border-radius:8px;margin:0 auto;">Radar chart (preview)</div>
    </div>
    <div class="pillar-stat-grid">
      {pillar_rows_html}
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <span class="card-title">Revenue Waterfall</span>
      <span class="card-sub">Recoverable revenue based on industry-standard conversion benchmarks</span>
    </div>
    {wf_rows_html}
    <div class="wf-summary-strip">
      <div class="wf-stat">
        <div class="wf-stat-lbl">Annual Recoverable Revenue</div>
        <div class="wf-stat-val loss">{money(total_loss)}</div>
      </div>
      <div class="wf-stat">
        <div class="wf-stat-lbl">Capture Rate</div>
        <div class="wf-stat-val">{pct(wf.get('captureRatePercent'))}</div>
      </div>
      <div class="wf-stat">
        <div class="wf-stat-lbl">Biggest Leak Stage</div>
        <div class="wf-stat-val" style="font-size:16px;">{stg(wf.get('biggestLeakStage',''))}</div>
      </div>
    </div>
    {disclaimer}
  </div>

  <div class="card">
    <div class="card-head">
      <span class="card-title">What This Means</span>
      <span class="card-sub">Pillar insights translated into commercial impact</span>
    </div>
    <div class="qual-grid">
      {qual_cards_html}
    </div>
  </div>

  {sol_cards}
</div>
</body>
</html>"""


if __name__ == "__main__":
    # Recalculate waterfall with benchmark model
    INPUT["revenueWaterfall"] = recalculate_waterfall_benchmark(INPUT)
    wf = INPUT["revenueWaterfall"]
    print(f"Benchmark waterfall (annual):")
    print(f"  Engagement gap: £{wf['engagementLoss']:,}")
    print(f"  Attendance gap:  £{wf['attendanceLoss']:,}")
    print(f"  Conversion gap:  £{wf['conversionLoss']:,}")
    print(f"  Total recoverable: £{wf['totalLoss']:,}")
    print()

    solutions = run_solution_selection(INPUT)
    print(f"Solutions selected ({len(solutions)}):")
    for i, s in enumerate(solutions, 1):
        print(f"  {i}. [{s['tag']}] {s['title']} (priority {s['priority']})")

    html = generate_html(INPUT, solutions)

    out_path = os.path.join(tempfile.gettempdir(), "humtech_scorecard_preview.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\nPreview saved to: {out_path}")
    print("Opening in browser...")
    webbrowser.open(f"file:///{out_path.replace(os.sep, '/')}")
