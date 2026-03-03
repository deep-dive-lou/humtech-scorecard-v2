/**
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

