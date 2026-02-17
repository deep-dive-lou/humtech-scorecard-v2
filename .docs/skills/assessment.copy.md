# Assessment Copy (v2) — Source of Truth

This file is the **authoritative copy layer**.
You can rewrite *wording* freely here without touching scoring logic.

Rules:
- Keep question IDs (qids) stable unless you also update scoring + n8n.
- If you change answer options (A/B/C…), update `assessment.scoring.md` and follow `docs/operations/n8n.sync.md`.

---

## Pillars (radar axes)

1. Lead Engagement & Speed
2. Appointment Reliability & Conversion
3. Operational Focus & Time Efficiency
4. Systems & Automation Maturity
5. Revenue Protection & Leakage Control

---

## Current questions & answers (Notion export baseline)

# Assessment Q+A

Each answer is scored, then weighted across the pillars it affects most; we convert to a 0–10 maturity score per pillar and map that into clear bands.

# Maturity Bands

0.0–4.9   Critical        🔴 Red         Structural blockers limiting revenue or scale
5.0–6.9   Action Required 🟠 Amber       Foundations exist but execution is fragile
7.0–8.9   Average         🟢 Light Green Strong operating shape with leverage points
9.0–10.0  Optimised       🟢 Dark Green  Systemic advantage


**Pillars**
  P1:
    id: lead_engagement_speed
    label: Lead Engagement & Speed
    weight: 0.22

  P2:
    id: appointment_reliability_conversion
    label: Appointment Reliability & Conversion
    weight: 0.22

  P3:
    id: operational_focus_time_efficiency
    label: Operational Focus & Time Efficiency
    weight: 0.22

  P4:
    id: systems_automation_maturity
    label: Systems & Automation Maturity
    weight: 0.22

  P5:
    id: revenue_protection_leakage
    label: Revenue Protection & Leakage Control
    weight: 0.12

# Questions, Pillar, Weighting, Answers, Scoring, AnswerID

# Q1 
q_id: q1_engagement_method
question: How are you engaging new leads at the point of enquiry?

pillar_weights:
  lead_engagement_speed: 0.60
  revenue_protection_leakage_control: 0.40

answers:
  A:
    text: Instant conversational AI for assessment and closing/scheduling
    score: 5
  B:
    text: Automated instant SMS/Email on enquiry only
    score: 4
  C:
    text: Manual out reach only / automation plus outreach
    score: 2
  D:
    text: Clients self-book (e.g. Calendly)
    score: 3
  E:
    text: Other, please specify
    score: 0

# Q2
q_id: q2_response_time
question: On average, how long does it take from point of enquiry to first conversational engagement for your clients?

pillar_weights:
  lead_engagement_speed: 0.70
  revenue_protection_leakage_control: 0.30

answers:
  A: { text: Less than 60 seconds, score: 5 }
  B: { text: Less than 10 minutes, score: 4 }
  C: { text: Less than 1 hour, score: 3 }
  D: { text: More than 1 hour, score: 2 }
  E: { text: I don’t know / we don’t track this, score: 0 }

# Q3
q_id: q3_247_booking
question: Can your clients ask questions and book appointments 24/7, 7 days a week?

pillar_weights:
  lead_engagement_speed: 0.40
  systems_automation_maturity: 0.60

answers:
  A: { text: Yes, score: 5 }
  B: { text: No, score: 0 }


# Q4
q_id: q4_show_rate
question: What percentage of booked appointments show up?

pillar_weights:
  appointment_reliability_conversion: 0.60
  revenue_protection_leakage_control: 0.40

answers:
  A: { text: 0–30%, score: 2 }
  B: { text: 30–50%, score: 3 }
  C: { text: 50–70%, score: 4 }
  D: { text: 80%+, score: 5 }
  E: { text: I don’t know / we don’t track this, score: 0 }


# Q5
q_id: q5_repetitive_manual_processes
question: What percentage of processes are repetitive/manual? (E.g. data entry, spreadsheet work, report generating, compliance, follow up, copy/paste between systems)

pillar_weights:
  systems_automation_maturity: 1.0

answers:
  A: { text: 0–30%, score: 5 }
  B: { text: 30–50%, score: 4 }
  C: { text: 50–70%, score: 3 }
  D: { text: 80%+, score: 2 }
  E: { text: I don’t know / we don’t track this, score: 0 }


# Q6
q_id: q6_issue_detection
question: How often do issues show up in your business later than you’d like? (e.g. missed steps, delays, errors, unhappy clients)

pillar_weights:
  systems_automation_maturity: 0.60
  revenue_protection_leakage_control: 0.40

answers:
  A: { text: Regularly - we usually find out when something’s already gone wrong, score: 2 }
  B: { text: Occasionally - issues surface after some damage is done, score: 3 }
  C: { text: Rarely - we usually catch problems early, score: 4 }
  D: { text: Almost never - issues are flagged automatically before impact, score: 5 }


# Q7
q_id: q7_metric_tracking
question: Do you follow "If you can't measure it, you can't manage it"—tracking key metrics like Lead Velocity Rate, Pipeline Coverage Ratio, Sales Cycle Length, DNA + engagement, LTV, CRO, ROAS, and CAC?

pillar_weights:
  operational_focus_time_efficiency: 1.0

answers:
  A: { text: 100% - there is not a metric with an impact on revenue or time that we don’t measure., score: 5 }
  B: { text: 70% - mostly, although there may be a small number of key metrics that we don’t have clear sight of., score: 4 }
  C: { text: 50% - we have sight of roughly half of what we should., score: 3 }
  D: { text: >50% - we don’t know what we don’t know, and should be measuring more metrics which impact our service and revenue., score: 2 }


# Q8 
q_id: q8_non_revenue_time
question: On average how much time per week does each client facing team member spend performing non revenue generating tasks?

pillar_weights:
  operational_focus_time_efficiency: 0.60
  revenue_protection_leakage_control: 0.40

answers:
  A: { text: None, score: 5 }
  B: { text: 60 minutes or less per week, score: 4 }
  C: { text: 1–4 hours per week, score: 3 }
  D: { text: More than 4 hours per week, score: 2 }
  E: { text: I don’t know / we don’t track this, score: 0 }


# Q9 
q_id: q9_repetitive_tasks_time
question: How much time do you or your team spend performing standard repetitive tasks such as document requests, data entry and KPI/stats tracking?

pillar_weights:
  operational_focus_time_efficiency: 0.70
  systems_automation_maturity: 0.30

answers:
  A: { text: None, score: 5 }
  B: { text: 60 minutes or less per week, score: 4 }
  C: { text: 1–5 hours per week, score: 3 }
  D: { text: More than 5 hours per week, score: 2 }
  E: { text: I don’t know, score: 0 }


# Q10 
q_id: q10_kpi_tracking_quality
question: How would you rate your company KPI target tracking?

pillar_weights:
  systems_automation_maturity: 0.70
  appointment_reliability_conversion: 0.30

answers:
  A: { text: Perfect - we have sight of all stats on one dashboard, and minimal manual input is required, score: 5 }
  B: { text: Average - it could be displayed better and more of it is manual than we would like, score: 3 }
  C: { text: Poor - Either no automation or very poor to zero KPI/target tracking with no graphic visualisation, score: 0 }


# Q11
q_id: q11_documents_and_signatures
question: If your business sends and receives client documents or request signatures:

pillar_weights:
  systems_automation_maturity: 0.70
  operational_focus_time_efficiency: 0.30

answers:
  A:
    text: These are fully automated in one branded portal which handles document upload requests, signatures and chasing. Templates are used to eliminate manual repetition
    score: 5
  B:
    text: These are automated through a third party subscription platform.
    score: 4
  C:
    text: We request any documents or signatures via email from the client
    score: 0


## INFORMATIVE Qs (not scored)

# Q12
q_id: q12_current_situation
type: informational
question: >
  What best describes your current situation? (not all aspects may be relevant, just pick the best fit).

answers:
  A:
    text: >
      Complete automation: New clients experience an immediate 2 way triage appointment scheduling,
      over 80% of appointments are attended with pre-qualified leads and most clients transact.
      Our team don’t perform repetitive admin tasks and we don’t waste time or take risks
      requesting/receiving documents via email. Our sales and marketing including CRO are optimised
      and our KPI/target data is automated and visible in a simple dashboard
  B:
    text: >
      Part automation: New clients receive some automated outreach (email/SMS/PDF),
      appointments are fairly well attended with good to reasonable sales outcomes.
      Our team perform some repetitive tasks and admin. Our sales and marketing including CRO
      are reasonable although could be better. KPI/target tracking works, but it takes more time
      than we would like
  C:
    text: >
      Zero automation: New clients wait for manual outreach or simple automated message.
      There is no instantaneous 2 way conversation to build trust and engage the client.
      Our team perform repetitive tasks and time is spent producing emails manually including
      document requests/receipt. Our sales, KPI tracking and/or marketing may need some work
  D:
    text: Other, please specify

# Q13
q_id: q13_desired_outcome
type: informational
question: >
  What best describes the outcome you’re looking for?

answers:
  A:
    text: >
      Time saving (Deflection ROI). Our team waste a lot of time performing repetitive tasks
      (e.g. data entry, client management, document requests, chasing).
  B:
    text: >
      Revenue increase. We’d like to increase revenue without additional marketing spend
      through targeted AI efficiency upgrades
  C:
    text: >
      A combination of time saving and revenue increase
  D:
    text: >
      None of the above, we’re fine as we are.
  E:
    text: Other, please specify

# Q14
q_id: q14_ai_barriers
type: informational
question: >
  What has prevented you from implementing comprehensive AI strategy previously?

answers:
  A:
    text: >
      We’ve tried other platforms/apps and the technology did not meet our standards
      or solve a problem or evidence sufficient ROI/use case
  B:
    text: >
      We’ve found options are too expensive
  C:
    text: >
      We find AI technology confusing and lack any technical understanding
  D:
    text: >
      We haven’t had time to look into it in enough depth


# Q15
q_id: q15_solution_type
type: informational
question: >
  Which type of solution would best suit your needs?

answers:
  A:
    text: >
      I want to be at the cutting edge but don’t want to pay big AI salaries.
      A team of AI strategists to handle everything including in-depth system/processes review,
      proposal/implementation with clear associated ROI and long-term commitment to ongoing improvements.
  B:
    text: >
      I’m keen to consider AI implementation(s) only, such as your 24/7 conversational triage system,
      but I do not require ongoing support via your fractional strategist service
  C:
    text: >
      I’m happy with our existing systems, but would like to learn more about fractional AI strategists
      as a standalone service
  D:
    text: >
      I’m not currently concerned about the opportunity loss in time, revenue and lost business
  E:
    text: >
      Other, please specify (e.g. sales training / SOP’s, marketing optimisation /
      “I just want my business to make more money without spending more on ads”)

# Q16
q_id: q16_additional_notes
type: free_text
question: >
  Is there anything else you’d like us to know?
