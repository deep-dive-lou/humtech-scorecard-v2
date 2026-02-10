# Assessment Contract (v2) — Form ↔ n8n ↔ Outputs

This is the stability guarantee. When things change, this is what must remain true.

## Inbound payload (Webhook → Edit Fields)

Webhook node receives body:
- `body.timestamp` (string)
- `body.contact` object (name, email, company, mobile, title)
- `body.answers` (array)
- `body.rawAnswers` (object)
- `body.freeText` (object with free text answers)

`Edit Fields` maps these to top-level keys:
- `assessment_id` = "humtech_v2"
- `submission_id` = timestamp
- `submitted_at` = timestamp
- `email`, `name`, `company`, `mobile`, `job_title`
- `answers` (array)
- `rawAnswers` (object)
- `more_info_q` = freeText['q15-notes']
- `source` = "humtech-scorecard"

### REQUIRED for scoring
`rawAnswers` must be an object like:
```json
{
  "q1-engagement": "A",
  "q2-response-time": "B",
  "q3-availability": "A",
  "...": "C"
}
```

## Scoring output (Question Scoring / pillar weight)

Adds:
- `scoring.radar` (5 pillar scores 0–10)
- `scoring.pillars` (same)
- `scoring.overall.score10` (0–10)
- `scoring.overall.percent` (0–100)
- `scoring.overall.maturityBand` (string)
- `scoring.informative` (q12–q15)
- `scoring.qa` (debug info)

## Banding + copy output (banding / qual mapping)

Adds:
- `banding.overallBand` incl. `bandColor`
- `pillarInsights[pillarKey]` incl. `{
    score, bandLabel, bandMeaning, title, body, bandColor
  }`

## Downstream dependencies

### Radar chart URL
Expects:
- `scoring.radar.<pillarKey>` for each axis.

### PDF HTML builder
Expects:
- `radarUrl`
- `scoring.overall.*`
- `banding.overallBand.bandColor`
- `pillarInsights` object

### PDFShift
Expects:
- `source` (HTML string)

### Email node
Expects:
- `pdf_base64` populated by Extract From File
- `Edit Fields` still accessible (contact fields)
- `scoring.overall.*`

### GHL webhook
Expects:
- same score fields, used to set `customFields`

## Canonical pillar keys (DO NOT rename casually)

- leadEngagementSpeed
- appointmentReliabilityConversion
- operationalFocusTimeEfficiency
- systemsAutomationMaturity
- revenueProtectionLeakageControl
