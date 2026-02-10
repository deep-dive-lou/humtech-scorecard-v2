# Release Checklist — Scorecard v2

Run this whenever anything changes (form, scoring, copy, layout, integrations).

## A) Smoke test
- Submit a test assessment.
- Confirm webhook returns HTML (Respond to Webhook).
- Confirm GHL webhook returns 200.

## B) Scoring sanity
Verify in execution data:
- `rawAnswers` contains expected qids/answer IDs
- `scoring.pillars` has all 5 pillars (0–10)
- `scoring.overall.score10` present
- `banding.overallBand.bandColor` exists

## C) PDF generation
- PDFShift returns file (binary).
- Extract from File produces `pdf_base64` (non-empty).
- Visual spot-check: radar, band dot colour, 5 pillar cards.

## D) Email delivery
- Resend request returns 2xx.
- Email has PDF attachment.
- No broken template strings.

## E) Regression traps
- If you changed qids, check `scoring.qa.missingQuestions`.
