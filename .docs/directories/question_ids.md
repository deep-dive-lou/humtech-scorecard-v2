# Question IDs (qids) + Answer IDs (canonical)

This list must match what the form submits in `rawAnswers`.

## Scored (10 questions)

| Step | qid | Pillar | Answers | Also feeds |
|------|-----|--------|---------|------------|
| 1 | q1_engagement_method | lead_engagement_speed | A-E | Waterfall ghost rate |
| 2 | q2_response_time | lead_engagement_speed | A-E | |
| 3 | q3_247_booking | systems_automation_maturity | A-B | |
| 4 | q4_show_rate | appointment_reliability_conversion | A-E | Waterfall show rate |
| 5 | q5_repetitive_manual_processes | systems_automation_maturity | A-E | |
| 6 | q6_issue_detection | systems_automation_maturity | A-D | |
| 7 | q7_metric_tracking | operational_focus_time_efficiency | A-D | |
| 8 | q8_non_revenue_time | operational_focus_time_efficiency | A-E | |
| 9 | q11_documents_and_signatures | systems_automation_maturity | A-E | |
| 10 | q12_current_situation | systems_automation_maturity | A-C | Waterfall conversion rate |

## Qualification (unscored, feed waterfall)

| Step | qid | Answers |
|------|-----|---------|
| 11 | q_lead_volume | A-E |
| 12 | q_deal_value | A-E |
| 13 | q_estimated_gross_revenue | A-F |
| 14 | q_estimated_gross_margin | A-F |

## Informational (unscored, multi-select)

| Step | qid | Answers |
|------|-----|---------|
| 15 | q13_desired_outcome | A-I (multi-select) |
| 16 | q14_ai_barriers | A-H (multi-select) |

## Free text

| Step | qid | Notes |
|------|-----|-------|
| 17 | q16_additional_notes | Sent in `freeText`, not `rawAnswers` |
| 18 | (email capture) | contact.name, email, company, mobile, title |

## Removed

- ~~q9_repetitive_tasks_time~~ (merged into q8, deleted)
- ~~q10_kpi_tracking_quality~~ (duplicated q7, deleted)
- ~~q15_solution_type~~ (covered by q14_ai_barriers, deleted)
