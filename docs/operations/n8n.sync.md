# n8n Sync Guide — “When code changes, what must I update in n8n?”

This is the file you want to read after any code/form update.

## Golden rule
- Change **copy** → usually only update `banding / qual mapping` copy or `email` copy.
- Change **IDs / answers / scoring** → you must update the scoring maps and then run the release checklist.

## 1) If the FORM changes

### You changed a question ID (qid)
Update:
- `Question Scoring / pillar weight`
  - `SCORE_0_TO_5` keys
  - `QUESTION_WEIGHTS` keys
- `docs/directories/question_ids.md`

Then verify:
- `scoring.qa.missingQuestions` is empty for a test submission.

### You changed answer options (A/B/C/D/E/F)
Update:
- `Question Scoring / pillar weight` map for that qid.

### You moved a question from scored → informative (or vice versa)
Update:
- scoring maps + weights (scored)
- `informative` block (informative)

## 2) If scoring logic changes

### Pillar weights per question changed
Update:
- `QUESTION_WEIGHTS` in `Question Scoring / pillar weight`

### Overall pillar importance changed
Update:
- `PILLAR_IMPORTANCE` in `Question Scoring / pillar weight`

### Band thresholds changed
Update:
- `bandFor()` in `Question Scoring / pillar weight`
- `BAND_META` + `bandScore()` in `banding / qual mapping`

## 3) If qualitative write-ups change
Update:
- `QUAL_COPY` in `banding / qual mapping`

If you add a pillar:
- Update `PILLAR_ORDER` and `PILLAR_LABELS` in **Build PDF HTML**
- Update labels + values arrays in **Radar chart URL**
- Update scoring outputs to include the new pillar key

## 4) If email copy changes
Update:
- `email` (Code node)

⚠️ Node renames break expressions (e.g. $('Edit Fields')). Keep names stable.
