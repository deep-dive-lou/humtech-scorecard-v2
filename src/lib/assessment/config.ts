import { AssessmentConfig } from "./types";

export const assessmentConfig: AssessmentConfig = {
  pillars: [
    { id: "lead_engagement_speed", name: "Lead Engagement & Efficacy" },
    { id: "appointment_reliability_conversion", name: "Appointment Reliability & Conversion" },
    { id: "operational_focus_time_efficiency", name: "Operational Focus & Time Efficiency" },
    { id: "systems_automation_maturity", name: "Systems & Automation Maturity" },
    { id: "revenue_protection_leakage", name: "Revenue Protection & Leakage Control" },
    { id: "informative", name: "Additional Information" },
  ],
  questions: [
    // ── Q1: Engagement method (scored, radio) ──
    {
      id: "q1_engagement_method",
      pillar: "lead_engagement_speed",
      text: "How are you engaging new leads at the point of enquiry?",
      isScored: true,
      options: [
        { id: "ai", label: "Instant conversational AI for assessment and closing/scheduling", answerId: "A" },
        { id: "automated-basic", label: "Automated instant SMS/Email on enquiry only", answerId: "B" },
        { id: "manual", label: "Manual out reach only / automation plus outreach", answerId: "C" },
        { id: "calendar", label: "Clients self-book (e.g. Calendly)", answerId: "D" },
        { id: "other", label: "Other, please specify", answerId: "E", hasTextInput: true },
      ],
    },
    // ── Q2: 24/7 booking (scored, radio) ──
    {
      id: "q3_247_booking",
      pillar: "systems_automation_maturity",
      text: "Can your clients ask questions and book appointments 24/7, 7 days a week?",
      isScored: true,
      options: [
        { id: "yes", label: "Yes", answerId: "A" },
        { id: "no", label: "No", answerId: "B" },
      ],
    },
    // ── Q3: Response time (scored, radio) ──
    {
      id: "q2_response_time",
      pillar: "lead_engagement_speed",
      text: "On average, how long does it take from point of enquiry to first conversational engagement for your clients?",
      isScored: true,
      options: [
        { id: "60s", label: "Less than 60 seconds", answerId: "A" },
        { id: "10m", label: "Less than 10 minutes", answerId: "B" },
        { id: "1h", label: "Less than 1 hour", answerId: "C" },
        { id: "1h-plus", label: "More than 1 hour", answerId: "D" },
        { id: "unknown", label: "I don\u2019t know / we don\u2019t track this", answerId: "E" },
      ],
    },
    // ── Q4: Booking rate (scored, NUMERIC %) ──
    {
      id: "q4_show_rate",
      pillar: "appointment_reliability_conversion",
      text: "What percentage of new leads schedule an appointment/call?",
      isScored: true,
      inputType: "numeric",
      numericConfig: {
        min: 0,
        max: 100,
        step: 1,
        unit: "percent",
        placeholder: "e.g. 60",
        hint: "Enter your monthly average as a percentage",
        fallbackOption: {
          id: "not-relevant",
          label: "Not relevant / unsure / rather not say",
          answerId: "F",
        },
        fallbackDisclaimer: "Please be aware that this will impact the predictive power of your assessment",
      },
      options: [],
    },
    // ── Q5: Attendance rate (NUMERIC %, NEW) ──
    {
      id: "q_attendance_rate",
      pillar: "appointment_reliability_conversion",
      text: "If relevant, what percentage of these booked calls/appointments show up?",
      isScored: false,
      inputType: "numeric",
      numericConfig: {
        min: 0,
        max: 100,
        step: 1,
        unit: "percent",
        placeholder: "e.g. 80",
        hint: "Enter your monthly average as a percentage",
        fallbackOption: {
          id: "not-relevant",
          label: "Not relevant / unsure / rather not say",
          answerId: "F",
        },
        fallbackDisclaimer: "Please be aware that this will impact the predictive power of your assessment",
      },
      options: [],
    },
    // ── Q6: Transaction rate (NUMERIC %, NEW) ──
    {
      id: "q_transaction_rate",
      pillar: "appointment_reliability_conversion",
      text: "What percentage of attended calls/appointments transact?",
      isScored: false,
      inputType: "numeric",
      numericConfig: {
        min: 0,
        max: 100,
        step: 1,
        unit: "percent",
        placeholder: "e.g. 50",
        hint: "Enter your monthly average as a percentage",
        fallbackOption: {
          id: "not-relevant",
          label: "Not relevant / unsure / rather not say",
          answerId: "F",
        },
        fallbackDisclaimer: "Please be aware that this will impact the predictive power of your assessment",
      },
      options: [],
    },
    // ── Q7: Deal value (NUMERIC £, changed from radio ranges) ──
    {
      id: "q_deal_value",
      pillar: "informative",
      text: "What is your average revenue per sale/transaction?",
      isScored: false,
      inputType: "numeric",
      numericConfig: {
        min: 0,
        max: 10000000,
        step: 1,
        unit: "currency",
        currencySymbol: "\u00a3",
        placeholder: "e.g. 5000",
        hint: "Enter average revenue per sale in £",
        fallbackOption: {
          id: "unknown",
          label: "I don\u2019t know / rather not say",
          answerId: "E",
        },
        fallbackDisclaimer: "Please be aware that this will impact the predictive power of your assessment",
      },
      options: [],
    },
    // ── Q8: Lead volume (NUMERIC, changed from radio ranges) ──
    {
      id: "q_lead_volume",
      pillar: "informative",
      text: "How many new enquiries/leads does your business typically receive per month?",
      isScored: false,
      inputType: "numeric",
      numericConfig: {
        min: 0,
        max: 100000,
        step: 1,
        unit: "integer",
        placeholder: "e.g. 200",
        hint: "Enter your average monthly lead count",
        fallbackOption: {
          id: "unknown",
          label: "I don\u2019t know / we don\u2019t track this",
          answerId: "E",
        },
        fallbackDisclaimer: "Please be aware that this will impact the predictive power of your assessment",
      },
      options: [],
    },
    // ── Q9: Repetitive processes (scored, radio) ──
    {
      id: "q5_repetitive_manual_processes",
      pillar: "systems_automation_maturity",
      text: "What percentage of processes are repetitive/manual? (e.g. data entry, spreadsheet work, report generating, compliance, follow up, copy/paste between systems)",
      isScored: true,
      options: [
        { id: "0-30", label: "0\u201330%", answerId: "A" },
        { id: "30-50", label: "30\u201350%", answerId: "B" },
        { id: "50-70", label: "50\u201370%", answerId: "C" },
        { id: "80-plus", label: "80%+", answerId: "D" },
        { id: "unknown", label: "I don\u2019t know / we don\u2019t track this", answerId: "E" },
      ],
    },
    // ── Q10: Issue detection (scored, radio) ──
    {
      id: "q6_issue_detection",
      pillar: "systems_automation_maturity",
      text: "How often do issues show up in your business later than you\u2019d like? (e.g. missed steps, delays, errors, unhappy clients)",
      isScored: true,
      options: [
        { id: "regularly", label: "Regularly - we usually find out when something\u2019s already gone wrong", answerId: "A" },
        { id: "occasionally", label: "Occasionally - issues surface after some damage is done", answerId: "B" },
        { id: "rarely", label: "Rarely - we usually catch problems early", answerId: "C" },
        { id: "almost-never", label: "Almost never - issues are flagged automatically before impact", answerId: "D" },
      ],
    },
    // ── Q11: Metric tracking (scored, radio) ──
    {
      id: "q7_metric_tracking",
      pillar: "operational_focus_time_efficiency",
      text: "Do you track key revenue metrics in one place e.g. time to lead engagement, conversion %, staff deflection savings, pipeline coverage, and sales cycle length?",
      isScored: true,
      options: [
        { id: "100", label: "100% - there is not a metric with an impact on revenue or time that we don\u2019t measure.", answerId: "A" },
        { id: "70", label: "70% - mostly, although there may be a small number of key metrics that we don\u2019t have clear sight of.", answerId: "B" },
        { id: "50", label: "50% - we have sight of roughly half of what we should.", answerId: "C" },
        { id: "sub-50", label: ">50% - we don\u2019t know what we don\u2019t know, and should be measuring more metrics which impact our service and revenue.", answerId: "D" },
      ],
    },
    // ── Q12: Non-revenue time (scored, radio) ──
    {
      id: "q8_non_revenue_time",
      pillar: "operational_focus_time_efficiency",
      text: "On average how much time per week does each client facing team member spend performing non revenue generating tasks?",
      isScored: true,
      options: [
        { id: "none", label: "None", answerId: "A" },
        { id: "60m", label: "60 minutes or less per week", answerId: "B" },
        { id: "1-5h", label: "1\u20135 hours per week", answerId: "C" },
        { id: "5h-plus", label: "More than 5 hours per week", answerId: "D" },
        { id: "unknown", label: "I don\u2019t know / we don\u2019t track this", answerId: "E" },
      ],
    },
    // ── Q13: Documents & signatures (scored, radio) ──
    {
      id: "q11_documents_and_signatures",
      pillar: "systems_automation_maturity",
      text: "If your business sends and receives client documents or request signatures:",
      isScored: true,
      options: [
        { id: "fully-automated", label: "These are fully automated in one branded portal which handles document upload requests, signatures and chasing. Templates are used to eliminate manual repetition", answerId: "A" },
        { id: "third-party", label: "This is facilitated through a third-party subscription platform (which one?), and does it meet your needs?", answerId: "B", hasTextInput: true },
        { id: "manual", label: "We request any documents or signatures via email from the client", answerId: "C" },
        { id: "not-applicable", label: "Not applicable", answerId: "D" },
        { id: "other", label: "Other, please specify:", answerId: "E", hasTextInput: true },
      ],
    },
    // ── Q14: Marketing channels (multiSelect, NEW) ──
    {
      id: "q_marketing_channels",
      pillar: "informative",
      text: "Are you actively advertising on social media? If so, which channels? (Select all that apply)",
      isScored: false,
      isMultiSelect: true,
      options: [
        { id: "meta", label: "Meta (Facebook/Instagram)", answerId: "A" },
        { id: "google", label: "Google / YouTube", answerId: "B" },
        { id: "tiktok", label: "TikTok", answerId: "C" },
        { id: "linkedin", label: "LinkedIn", answerId: "D" },
        { id: "other", label: "Other, please specify", answerId: "E", hasTextInput: true },
        { id: "none", label: "We don\u2019t advertise on social media", answerId: "F" },
      ],
    },
    // ── Q15: Marketing spend (radio, NEW) ──
    {
      id: "q_marketing_spend",
      pillar: "informative",
      text: "How much are you currently spending on social media advertising per month?",
      isScored: false,
      options: [
        { id: "under-10k", label: "Under \u00a310,000", answerId: "A" },
        { id: "10k-30k", label: "\u00a310,000 - \u00a330,000", answerId: "B" },
        { id: "30k-70k", label: "\u00a330,000 - \u00a370,000", answerId: "C" },
        { id: "70k-120k", label: "\u00a370,000 - \u00a3120,000", answerId: "D" },
        { id: "over-120k", label: "Over \u00a3120,000", answerId: "E" },
      ],
    },
    // ── Q16: CRO specialist (radio, NEW) ──
    {
      id: "q_cro_specialist",
      pillar: "informative",
      text: "Have you hired a Conversion Rate Optimization specialist for your acquisition process in the last 2 years?",
      isScored: false,
      options: [
        { id: "yes-positive", label: "Yes, and it made a positive impact", answerId: "A" },
        { id: "yes-negative", label: "Yes, but the results were disappointing", answerId: "B" },
        { id: "no", label: "No", answerId: "C" },
      ],
    },
    // ── Q17: Current situation (scored, radio) ──
    {
      id: "q12_current_situation",
      pillar: "systems_automation_maturity",
      text: "What best describes your **current** situation? (not all aspects may be relevant, just pick the best fit).",
      isScored: true,
      options: [
        { id: "advanced", label: "Advanced conversational AI. Over 80% new leads book and attend appointments. Industry leading sales conversion. Minimum or zero repetitive admin. Zero GDPR risk or time loss through email/doc requests. Lead gen & marketing optimal (ROAS/CRO/CAC/CPL/Copy & Creatives). KPI data is cutting edge and visible in one place.", answerId: "A" },
        { id: "some", label: "Some AI/automation. 50% new leads book and attend appointments. Industry average sales conversion. Some repetitive admin. Some GDPR risk & time loss through email/doc requests. Lead gen and marketing average (ROAS/CRO/CAC/CPL/Copy & Creatives). KPI data partially automated but could be improved.", answerId: "B" },
        { id: "none", label: "No AI/automation. <50% new leads book & attend appointments. Below desired sales conversion. High repetitive admin. Medium-high GDPR risk & time loss through email/doc requests. Lead gen & marketing unsatisfactory (ROAS/CRO/CAC/CPL/Copy & Creatives). KPI data has manual elements and metrics/display could be improved.", answerId: "C" },
      ],
    },
    // ── Q18: Desired outcome (multiSelect) ──
    {
      id: "q13_desired_outcome",
      pillar: "informative",
      text: "What best describes the outcome you\u2019re looking for? (Select all that apply)",
      isScored: false,
      isMultiSelect: true,
      options: [
        { id: "time-saving", label: "Time saving deflection ROI - more output per unit of time, fewer manual processes", answerId: "A" },
        { id: "ai-sales", label: "\u2018Done For You\u2019 AI sales system with guaranteed attendance and conversion improvement", answerId: "B" },
        { id: "ai-leadgen", label: "\u2018Done For You\u2019 AI lead generation with guaranteed ROAS improvement (full ad account management)", answerId: "C" },
        { id: "growth", label: "Growth without friction or linear headcount requirements", answerId: "D" },
        { id: "staff-retention", label: "Reduced staff frustration and turnover from manual repetitive tasks", answerId: "E" },
        { id: "revenue-growth", label: "Overall revenue growth without retainers or up-front payments (pay on results only)", answerId: "F" },
        { id: "governance", label: "Enhance governance / reduce GDPR risk (e.g. ensure cloud data stored in UK data centres / cease sending and/or receiving sensitive data or documents via email)", answerId: "G" },
        { id: "none", label: "None of the above, we\u2019re fine as we are.", answerId: "H" },
        { id: "other", label: "Other, please specify:", answerId: "I", hasTextInput: true },
      ],
    },
    // ── Q19: AI barriers (multiSelect) ──
    {
      id: "q14_ai_barriers",
      pillar: "informative",
      text: "What has prevented you from implementing a comprehensive AI strategy previously? (Select all that apply)",
      isScored: false,
      isMultiSelect: true,
      options: [
        { id: "tech-failed", label: "We\u2019ve tried other platforms/apps and the technology did not meet our standards, solve a problem, or evidence sufficient ROI/use case", answerId: "A" },
        { id: "expensive", label: "We\u2019ve found options are too expensive", answerId: "B" },
        { id: "no-upfront", label: "We don\u2019t want to commit to upfront payments, retainers or contracts without evidence that the system produces results for our business specifically", answerId: "C" },
        { id: "no-comprehensive", label: "We have yet to find a comprehensive solution which can implement AI infrastructure across all departments - most services only solve one or two problems", answerId: "D" },
        { id: "aftercare", label: "We don\u2019t want to use an \u2018out the box\u2019 service without specialised aftercare in case there are issues", answerId: "E" },
        { id: "no-upheaval", label: "We don\u2019t want upheaval or new systems - AI has to integrate with the software and infrastructure already in place", answerId: "F" },
        { id: "hands-off", label: "We don\u2019t have time to learn about AI systems. We need a \u2018hands off\u2019 system which doesn\u2019t incur additional time costs to our staff", answerId: "G" },
        { id: "other", label: "Other, please specify:", answerId: "H", hasTextInput: true },
      ],
    },
    // ── Q20: Gross revenue (radio) ──
    {
      id: "q_estimated_gross_revenue",
      pillar: "informative",
      text: "Estimated gross revenue:",
      isScored: false,
      options: [
        { id: "50m-plus", label: "50 million+", answerId: "A" },
        { id: "10m-50m", label: "10-50 million", answerId: "B" },
        { id: "5m-10m", label: "5-10 million", answerId: "C" },
        { id: "3m-5m", label: "3-5 million", answerId: "D" },
        { id: "under-3m", label: "Less than 3 million", answerId: "E" },
        { id: "unknown", label: "I don\u2019t know", answerId: "F" },
      ],
    },
    // ── Q21: Gross margin (radio) ──
    {
      id: "q_estimated_gross_margin",
      pillar: "informative",
      text: "Estimated gross margin:",
      isScored: false,
      options: [
        { id: "90-plus", label: "90%+", answerId: "A" },
        { id: "70-90", label: "70-90%", answerId: "B" },
        { id: "50-70", label: "50-70%", answerId: "C" },
        { id: "30-50", label: "30-50%", answerId: "D" },
        { id: "under-30", label: "Under 30%", answerId: "E" },
        { id: "unknown", label: "I don\u2019t know", answerId: "F" },
      ],
    },
  ],
};