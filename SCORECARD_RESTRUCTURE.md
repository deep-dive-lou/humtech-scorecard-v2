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

## Revenue Loss Calculation

With Q1 (lead volume) and Q2 (deal value), n8n calculates estimated monthly pipeline and stage-by-stage losses using midpoint values:

```
Lead volume midpoints:  Under 50 → 30,  50-200 → 125,  200-500 → 350,  500+ → 600
Deal value midpoints:   Under £500 → £300,  £500-2k → £1,250,  £2k-10k → £6,000,  £10k+ → £15,000

Monthly pipeline = lead_volume × deal_value

Loss at engagement   = pipeline × ghost_rate
Loss at attendance   = (pipeline - engagement_loss) × (1 - show_rate)
Loss at conversion   = (remaining) × (1 - conversion_rate)
Actually closing     = pipeline - all_losses
Capture rate         = actually_closing / pipeline × 100
```

### Example

200 leads/month, £3k avg deal, 30% ghost, 70% show, 60% conversion:

```
Pipeline:           200 × £3,000 = £600,000/month
Lost at engagement: £600k × 0.30 = -£180,000
Lost at attendance: £420k × 0.30 = -£126,000
Lost at conversion: £294k × 0.40 = -£117,600
Actually closing:   £176,400/month (29% capture rate)
```

### "Don't track" handling

When a prospect answers "Don't track / Unsure" on a conversion metric, use industry average defaults:

- Ghost rate default: 35%
- Show rate default: 70%
- Conversion rate default: 55%

Flag these in results: "We used industry averages where you don't currently track — which itself is a finding."

## Results Output

### Pipeline Waterfall (replaces or supplements radar chart)

Visual showing £ value flowing through stages with losses highlighted at each drop-off. Biggest loss is flagged as "We deploy here first."

```
ENQUIRY          ████████████████████ £600k
                 ▼ 30% ghosted = -£180k        ← BIGGEST LEAK
ENGAGED          ██████████████ £420k
                 ▼ 30% no-show = -£126k
ATTENDED         █████████ £294k
                 ▼ 40% don't convert = -£118k
CLOSED           █████ £176k

You're capturing 29% of your pipeline potential.
Your biggest leak is at the ENQUIRY stage.
```

### Stage-to-Product Mapping in Results

| Biggest leak at... | Results say... |
|---|---|
| Engagement (Q3-Q6) | "Speed-to-lead automation typically recovers 40-60% of ghosted leads" |
| Attendance (Q7-Q8) | "Automated reminder sequences typically lift show rates by 20-30%" |
| Conversion (Q9) | "Structured follow-up automation typically improves close rates by 15-25%" |
| Operations (Q10-Q12) | "Process automation typically reclaims 5-15hrs/week per team member" |
| Visibility (Q13) | "You can't improve what you don't measure — revenue visibility is step one" |

## Sales Qualification Output

For internal use (not shown to prospect), the scorecard submission should include:

```json
{
  "qualification": {
    "estimated_monthly_pipeline": 600000,
    "estimated_monthly_loss": 423600,
    "capture_rate_percent": 29,
    "biggest_leak_stage": "engagement",
    "recommended_lead_product": "booking_bot",
    "deal_value_tier": "mid",
    "decision_maker": true
  }
}
```

This tells Chris S before the call: pipeline size, biggest problem, what to pitch, and whether the person can actually sign.

## Implementation Notes

- Questions 1-2 are qualification — they don't appear on the radar chart or score
- Questions 3-13 are scored — these feed the radar chart (now with 5 axes instead of 4)
- The revenue calculation runs server-side in n8n after submission
- Results page shows both the pipeline waterfall AND the radar chart
- Internal Slack/CRM notification includes the qualification JSON
- Copy for questions needs writing by Chris S — structure and intent is defined here, final wording is his call
