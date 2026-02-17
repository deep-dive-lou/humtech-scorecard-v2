# Question IDs (qids) + Answer IDs (canonical)

This list must match what the form submits in `rawAnswers`.

## Scored qids (expected by scoring node)
### Scored (Q1-Q12)
- q1_engagement_method
- q2_response_time
- q3_247_booking
- q4_show_rate
- q5_repetitive_manual_processes
- q6_issue_detection
- q7_metric_tracking
- q8_non_revenue_time
- q9_repetitive_tasks_time
- q10_kpi_tracking_quality
- q11_documents_and_signatures
- q12_current_situation

### Informational (Q13-Q16)
- q13_desired_outcome (multi-select)
- q14_ai_barriers (multi-select)
- q15_solution_type
- q16_additional_notes (free text, sent in `freeText`)

## Answer IDs
Default: A, B, C, D, E (and sometimes F).
If you introduce new answer IDs, update scoring maps accordingly.

## Legacy note
Older n8n docs/workflow snippets may still show hyphenated IDs (for example `q1-engagement`). Those are outdated for this frontend and should be migrated to the snake_case IDs above.
