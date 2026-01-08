import { AssessmentConfig } from "./types";

export const assessmentConfig: AssessmentConfig = {
  pillars: [
    { id: "customer", name: "Client Engagement" },
    { id: "operations", name: "Operations & Efficiency" },
    { id: "revenue", name: "Revenue & Growth" },
    { id: "data", name: "Data & Insights" },
  ],
  questions: [
    {
      id: "q1-engagement",
      pillar: "customer",
      text: "How do you engage new clients at the point of enquiry?",
      options: [
        { id: "ai", label: "Instant conversational AI for assessment and scheduling" },
        { id: "automated-basic", label: "Automated instant SMS/Email on submission only" },
        { id: "manual", label: "Manual sales team outreach only / automation plus sales team outreach" },
        { id: "calendar", label: "Calendar function (e.g. Calendly) where clients pick time/date to schedule appointment" },
      ],
    },
    {
      id: "q2-response-time",
      pillar: "customer",
      text: "On average, how long does it take from point of enquiry to first conversational engagement for new clients?",
      options: [
        { id: "60s", label: "Less than 60 seconds" },
        { id: "10m", label: "Less than 10 minutes" },
        { id: "1h", label: "Less than one hour" },
        { id: "1h-plus", label: "More than one hour" },
      ],
    },
    {
      id: "q3-availability",
      pillar: "customer",
      text: "Can your clients ask questions and book sales appointments 24/7, 7 days a week?",
      options: [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
      ],
    },
    {
      id: "q4-show-rate",
      pillar: "customer",
      text: "What percentage of booked appointments show up?",
      options: [
        { id: "90-plus", label: "90%+" },
        { id: "70-90", label: "70-90%" },
        { id: "50-70", label: "50-70%" },
        { id: "sub-50", label: "Less than 50%" },
        { id: "no-track", label: "We don't track this data / we don't schedule appointments / unsure" },
      ],
    },
    {
      id: "q5-ghost-rate",
      pillar: "customer",
      text: "What percentage of new clients 'ghost' you? (i.e. reach out on website/landers but never engage)",
      options: [
        { id: "sub-5", label: "Less than 5%" },
        { id: "sub-20", label: "Less than 20%" },
        { id: "sub-40", label: "Less than 40%" },
        { id: "40-plus", label: "More than 40%" },
        { id: "no-track", label: "We don't track this data / unsure" },
      ],
    },
    {
      id: "q6-conversion",
      pillar: "revenue",
      text: "What percentage of new clients who engage with your business 'transact' with your service?",
      options: [
        { id: "90-100", label: "90-100%" },
        { id: "70-90", label: "70-90%" },
        { id: "50-70", label: "50-70%" },
        { id: "sub-50", label: "Less than 50%" },
        { id: "no-track", label: "We don't track this data / unsure" },
      ],
    },
    {
      id: "q7-primary-role",
      pillar: "operations",
      text: "How much of your team's time is spent performing their primary role (e.g. amount of time your sales team are on sales calls vs. other non-revenue generating tasks)?",
      options: [
        { id: "90-100", label: "90-100%" },
        { id: "80-90", label: "80-90%" },
        { id: "70-80", label: "70-80%" },
        { id: "60-70", label: "60-70%" },
        { id: "no-track", label: "We don't track this data / unsure" },
      ],
    },
    {
      id: "q8-follow-up-time",
      pillar: "operations",
      text: "How much time do your team spend engaging leads who reached out but did not book an appointment, or did not attend a scheduled appointment?",
      options: [
        { id: "none", label: "None" },
        { id: "30m", label: "30 minutes or less per week" },
        { id: "1-4h", label: "1-4 hours per week" },
        { id: "4h-plus", label: "More than 4 hours per week" },
        { id: "no-track", label: "We don't track this data / unsure" },
      ],
    },
    {
      id: "q9-repetitive-tasks",
      pillar: "operations",
      text: "How much time do your team spend performing standard repetitive tasks such as document requests, data entry, computer admin and KPI/stats tracking?",
      options: [
        { id: "none", label: "None" },
        { id: "1h", label: "One hour or less per week" },
        { id: "1-5h", label: "1-5 hours per week" },
        { id: "5h-plus", label: "More than 5 hours per week" },
        { id: "no-track", label: "We don't track this data / unsure" },
      ],
    },
    {
      id: "q10-kpi-tracking",
      pillar: "data",
      text: "How would you rate your company KPI and target tracking?",
      options: [
        { id: "perfect", label: "Perfect - we have sight of all stats on one dashboard, and minimal manual input is required" },
        { id: "average", label: "Average - it could be displayed better and more of it is manual than we would like" },
        { id: "poor", label: "Poor - Either no automation or very poor to zero KPI/target tracking with no graphic visualisation" },
      ],
    },
    {
      id: "q11-documents",
      pillar: "operations",
      text: "If your business sends and receives client documents or requests signatures (e.g. AML/KYC/Compliance docs):",
      options: [
        { id: "fully-automated", label: "Fully automated in one company branded portal which handles all document upload requests and signatures" },
        { id: "third-party", label: "Automated through a third-party subscription platform" },
        { id: "manual", label: "We request documents or signatures via email or other manual process" },
        { id: "not-relevant", label: "Not relevant to our processes" },
      ],
    },
  ],
};