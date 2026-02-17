# Troubleshooting — Scorecard v2

## 1) Scores are all zeros
Cause: form not sending expected `rawAnswers` keys.
Fix: compare webhook body against `docs/directories/question_ids.md`.
Update scoring maps in `Question Scoring / pillar weight`.

## 2) Radar chart missing
Cause: `radarUrl` not created or pillar keys mismatch.
Fix: ensure `scoring.radar` includes all 5 pillar keys.

## 3) PDFShift error
Cause: invalid HTML string or missing `source`.
Fix: verify `Build PDF HTML` outputs `source` (full HTML doc).

## 4) Email sends but no attachment
Cause: `pdf_base64` empty or includes data URL prefix.
Fix: check Extract from File output and Email node prefix strip.

## 5) GHL fields not updating
Cause: webhook URL/field keys mismatch.
Fix: confirm `HTTP Request` payload paths & custom field keys in GHL.
