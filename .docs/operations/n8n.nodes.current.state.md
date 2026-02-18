# n8n Nodes — CURRENT LIVE STATE

Last updated: 2026-02-18

---

## NODE: Question Scoring / Pillar Weight

Scores Q1–Q8 + Q11–Q12 (10 scored questions, 0–5 scale → 0–10), applies pillar weights, computes overall maturity band.

**Inputs:** `$json.rawAnswers`, `$json.freeText`
**Outputs:** `scoring.radar`, `scoring.pillars`, `scoring.overall`, `scoring.informative`

### Score maps (SCORE_0_TO_5)

| qid | A | B | C | D | E |
|-----|---|---|---|---|---|
| q1_engagement_method | 5 | 4 | 2 | 3 | 0 |
| q2_response_time | 5 | 4 | 3 | 2 | 0 |
| q3_247_booking | 5 | 0 | - | - | - |
| q4_show_rate | 2 | 3 | 4 | 5 | 0 |
| q5_repetitive_manual_processes | 5 | 4 | 3 | 2 | 0 |
| q6_issue_detection | 2 | 3 | 4 | 5 | - |
| q7_metric_tracking | 5 | 4 | 3 | 2 | - |
| q8_non_revenue_time | 5 | 4 | 3 | 2 | 0 |
| q11_documents_and_signatures | 5 | 4 | 0 | - | - |
| q12_current_situation | 5 | 3 | 1 | - | - |

### Pillar weights (QUESTION_WEIGHTS)

| qid | leadEngagement | appointmentReliability | operationalFocus | systemsAutomation | revenueProtection |
|-----|---------------|----------------------|-----------------|-------------------|-------------------|
| q1_engagement_method | 0.6 | | | | 0.4 |
| q2_response_time | 0.7 | | | | 0.3 |
| q3_247_booking | 0.4 | | | 0.6 | |
| q4_show_rate | | 0.6 | | | 0.4 |
| q5_repetitive_manual_processes | | | | 1.0 | |
| q6_issue_detection | | | | 0.6 | 0.4 |
| q7_metric_tracking | | | 1.0 | | |
| q8_non_revenue_time | | | 0.6 | | 0.4 |
| q11_documents_and_signatures | | | 0.3 | 0.7 | |
| q12_current_situation | | | | 0.6 | 0.4 |

### Pillar importance (overall score weighting)

| Pillar | Weight |
|--------|--------|
| leadEngagementSpeed | 0.22 |
| appointmentReliabilityConversion | 0.22 |
| operationalFocusTimeEfficiency | 0.22 |
| systemsAutomationMaturity | 0.22 |
| revenueProtectionLeakageControl | 0.12 |

### Maturity bands

| Band | Range |
|------|-------|
| Critical | 0.0–4.9 |
| Action Required | 5.0–6.9 |
| Average | 7.0–8.9 |
| Optimised | 9.0–10.0 |

### Informative pass-through

- `q13DesiredOutcome` — array from q13_desired_outcome (multi-select)
- `q14AiBarriers` — array from q14_ai_barriers (multi-select)
- `q16AdditionalNotes` — string from freeText.q16_additional_notes

---

## NODE: Banding / Qual Mapping

Consumes `scoring.pillars` and `scoring.overall.score10`. No question IDs referenced.

- Maps each pillar score to a band (Critical / Action Required / Average / Optimised)
- Attaches qualitative copy (title + body) per pillar per band
- Assigns traffic light colours: red (#C62828), amber (#F9A825), green (#1B5E20)
- Outputs: `banding.bandsMeta`, `banding.overallBand`, `pillarInsights`

No changes needed when questions change — this node only reads pillar scores.

---

## NODE: Revenue Waterfall

Calculates pipeline value and stage-by-stage revenue leakage.

**Inputs:** `$json.rawAnswers`, `$json.qualification`, `$json.contact`

### Formula

```
Pipeline = leads/month × avg deal value
Captured = Pipeline × (1 − ghost%) × show% × conversion%
```

### Stage rate sources

| Stage | Source question | Answer→Rate | Default |
|-------|---------------|-------------|---------|
| Ghost rate | q1_engagement_method | A:10% B:20% C:35% D:30% E:35% | 35% |
| Show rate | q4_show_rate | A:30% B:50% C:70% D:85% E:70% | 70% |
| Conversion | q12_current_situation | A:80% B:60% C:35% D:50% | 55% |

### Qualification midpoints

| Lead volume | Midpoint | Deal value | Midpoint |
|-------------|----------|------------|----------|
| Under 50 (A) | 30 | Under £500 (A) | £300 |
| 50-200 (B) | 125 | £500-2k (B) | £1,250 |
| 200-500 (C) | 350 | £2k-10k (C) | £6,000 |
| 500+ (D) | 600 | £10k+ (D) | £15,000 |
| Unknown (E) | 125 | Unknown (E) | £1,250 |

### Outputs

- `revenueWaterfall.pipeline`, `.engagementLoss`, `.attendanceLoss`, `.conversionLoss`, `.closedValue`, `.totalLoss`
- `revenueWaterfall.captureRatePercent`, `.biggestLeakStage`
- `revenueWaterfall.grossProfitPipeline`, `.grossProfitAtRisk` (when margin provided)
- `qualification.estimated_monthly_pipeline`, `.estimated_monthly_loss`, `.capture_rate_percent`, `.biggest_leak_stage`, `.recommended_lead_product`

### Biggest leak → product

| Leak stage | recommended_lead_product |
|------------|--------------------------|
| engagement | speed_to_lead |
| attendance | attendance_automation |
| conversion | conversion_followup |

---

## NODE: Radar Chart URL

Generates QuickChart radar URL from `scoring.radar` (5 pillar scores). No question IDs referenced — reads pillar scores only.

---

## NODE: Build PDF HTML

Generates HTML for PDF report using `scoring`, `pillarInsights`, `radarUrl`, and `contact` data.
