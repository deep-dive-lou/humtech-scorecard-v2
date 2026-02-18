# Scorecard Restructure — Pipeline-Mapped Qualification

## Why

The current scorecard groups questions by conceptual pillars (Client Engagement, Operations, Revenue, Data). The results show a radar chart with banding, but don't tell the prospect *what they're losing* or *what to do about it*.

The restructure maps every question to a pipeline stage. Combined with two new qualification questions (lead volume + deal value), n8n can calculate estimated revenue loss per stage and prescribe the product that fixes it.

The results email shifts from "you scored 6/10 on client engagement" to "you're losing an estimated £180k/month at the enquiry stage — we deploy here first."

## New Pillars

Old pillars → new pillars:

| Old | New | Maps to pipeline stage |
|-----|-----|----------------------|
| Client Engagement | Lead Engagement | Lead Created → Engaged |
| Client Engagement | Booking & Attendance | Booked → Showed |
| Revenue & Growth | Conversion | Showed → Won |
| Operations & Efficiency | Operations | Cross-cutting (time/cost) |
| Data & Insights | Visibility | Measurement layer |
| *(new)* | Qualification | Revenue ceiling calculation |

## New Question Structure

### Qualification (not scored — used for revenue calculations)

| # | Question | Options | Purpose |
|---|----------|---------|---------|
| Q1 | How many new enquiries/leads does your business receive per month? | Under 50 / 50-200 / 200-500 / 500+ | Volume multiplier |
| Q2 | What is your average deal or transaction value? | Under £500 / £500-2k / £2k-10k / £10k+ | Value multiplier |

### Lead Engagement (Q3-Q6)

Product: Booking bot / speed-to-lead system

| # | Question | Options (best → worst) | Existing Q |
|---|----------|----------------------|------------|
| Q3 | How do you engage new clients at the point of enquiry? | AI conversational / Automated SMS-email / Manual outreach / Calendar link only | q1-engagement |
| Q4 | How long from enquiry to first conversational response? | Under 60s / Under 10min / Under 1hr / Over 1hr | q2-response-time |
| Q5 | Can clients enquire and book 24/7? | Yes / No | q3-availability |
| Q6 | What % of new leads ghost after initial enquiry? | Under 5% / Under 20% / Under 40% / Over 40% / Don't track | q5-ghost-rate |

### Booking & Attendance (Q7-Q8)

Product: Reminder sequences, no-show recovery, re-booking automation

| # | Question | Options (best → worst) | Existing Q |
|---|----------|----------------------|------------|
| Q7 | What % of booked appointments actually show up? | 90%+ / 70-90% / 50-70% / Under 50% / Don't track | q4-show-rate |
| Q8 | How much time does your team spend chasing no-shows and no-books? | None / Under 30min/week / 1-4hrs/week / Over 4hrs/week / Don't track | q8-follow-up-time |

### Conversion (Q9)

Product: Post-meeting follow-up automation, proposal sequences

| # | Question | Options (best → worst) | Existing Q |
|---|----------|----------------------|------------|
| Q9 | What % of engaged clients transact with your business? | 90-100% / 70-90% / 50-70% / Under 50% / Don't track | q6-conversion |

### Operations (Q10-Q12)

Product: Process automation, doc portal

| # | Question | Options (best → worst) | Existing Q |
|---|----------|----------------------|------------|
| Q10 | How much of your team's time is spent on their primary role vs admin? | 90-100% / 80-90% / 70-80% / 60-70% / Don't track | q7-primary-role |
| Q11 | How much time does your team spend on repetitive tasks (data entry, doc requests, admin)? | None / Under 1hr/week / 1-5hrs/week / Over 5hrs/week / Don't track | q9-repetitive-tasks |
| Q12 | How are client documents and signatures handled? | Fully automated branded portal / Third-party platform / Manual email process / Not relevant | q11-documents |

### Visibility (Q13)

Product: Revenue dashboard / Growth Engine

| # | Question | Options (best → worst) | Existing Q |
|---|----------|----------------------|------------|
| Q13 | How would you rate your KPI and target tracking? | Perfect (one dashboard, minimal manual input) / Average (could be better, too manual) / Poor (little to no tracking or visualisation) | q10-kpi-tracking |

### Capture (not scored)

| # | Field | Notes |
|---|-------|-------|
| 14 | Pain points (free text, optional) | Verbatim customer language for sales calls |
| 15 | Role in business | Owner / Director / Manager / Other — decision-maker check |
| 16 | Email | Lead capture |

## Revenue Waterfall Calculation (IMPLEMENTED)

**Status:** Live in n8n as "Revenue Waterfall" code node.

### Formula

```
Pipeline = leads/month × avg deal value
Captured = Pipeline × (1 − ghost%) × show% × conversion%
Loss     = Pipeline − Captured
```

Losses are calculated sequentially at three funnel stages:
1. **Engagement** — loss = pipeline × ghost_rate (from Q1)
2. **Attendance** — loss = remaining × (1 − show_rate) (from Q4)
3. **Conversion** — loss = remaining × (1 − conversion_rate) (from Q12)

### Inputs

**Qualification answers → midpoints:**

| Lead volume answer | Midpoint | Deal value answer | Midpoint |
|---|---|---|---|
| Under 50 | 30 | Under £500 | £300 |
| 50-200 | 125 | £500-2k | £1,250 |
| 200-500 | 350 | £2k-10k | £6,000 |
| 500+ | 600 | £10k+ | £15,000 |
| Unknown | 125 | Unknown | £1,250 |

**Scored answers → stage rates:**

| Stage | Question | Answer→Rate mapping | Default |
|---|---|---|---|
| Ghost rate | q1_engagement_method | A:10%, B:20%, C:35%, D:30%, E:35% | 35% |
| Show rate | q4_show_rate | A:30%, B:50%, C:70%, D:85%, E:70% | 70% |
| Conversion | q12_current_situation | A:80%, B:60%, C:35%, D:50% | 55% |

**Gross margin lens** (optional, from q_estimated_gross_margin):

When provided, the node also calculates `grossProfitPipeline` and `grossProfitAtRisk` by applying the margin % to pipeline and total loss.

### Output

```json
{
  "revenueWaterfall": {
    "leadVolume": 200,
    "avgDealValue": 3000,
    "pipeline": 600000,
    "engagementLoss": 180000,
    "attendanceLoss": 126000,
    "conversionLoss": 117600,
    "closedValue": 176400,
    "totalLoss": 423600,
    "captureRatePercent": 29.4,
    "biggestLeakStage": "engagement",
    "grossProfitPipeline": null,
    "grossProfitAtRisk": null
  },
  "qualification": {
    "estimated_monthly_pipeline": 600000,
    "estimated_monthly_loss": 423600,
    "capture_rate_percent": 29,
    "biggest_leak_stage": "engagement",
    "recommended_lead_product": "speed_to_lead",
    "decision_maker": true
  }
}
```

### Biggest leak → product mapping

| Biggest leak | recommended_lead_product |
|---|---|
| engagement | `speed_to_lead` |
| attendance | `attendance_automation` |
| conversion | `conversion_followup` |

## Implementation Notes

- Q1–Q8 + Q11–Q12 are scored — these feed the radar chart (5 axes)
- Q1, Q4, Q12 also feed the revenue waterfall stage rates
- Qualification questions (lead volume, deal value, gross revenue, gross margin) feed the waterfall pipeline calculation
- The revenue waterfall runs server-side in n8n after scoring
- Results page shows both the pipeline waterfall AND the radar chart
- Internal Slack/CRM notification includes the qualification JSON
