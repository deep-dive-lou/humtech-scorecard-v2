# HumTech Scorecard (v2) — DOE / Skills Docs

These docs are designed so you can:
- edit questions/copy/scoring safely without breaking the workflow
- understand the contract between **form → n8n → pdf/email/GHL**
- quickly see what needs updating in n8n after code/form changes

**Primary source artifacts**
- Assessment Q+A (Notion export): see `docs/skills/assessment.copy.md`
- n8n blueprint: see `docs/operations/n8n.workflow.v2.reference.json`

## Quick start
1. Edit copy/questions: `docs/skills/assessment.copy.md`
2. Edit scoring/weights/bands: `docs/skills/assessment.scoring.md`
3. When you change IDs/answers/scoring, follow: `docs/operations/n8n.sync.md`
4. Release checklist before pushing live: `docs/operations/release.checklist.md`

## Current workflow
- n8n workflow: **HumTech Scorecard v.2**
- Webhook path id: **97e0ddcc-00b0-4f9e-a45c-2c484e9754bc**
- Key nodes: Webhook, Edit Fields, HTTP Request1, Extract from File, Radar chart URL, Build PDF HTML, PDFShift, Question Scoring / pillar weight, banding / qual mapping, Respond to Webhook, HTTP Request, email
