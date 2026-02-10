# n8n Nodes (v2) — Responsibilities & Dependencies

Workflow: **HumTech Scorecard v.2**
Webhook path: **97e0ddcc-00b0-4f9e-a45c-2c484e9754bc**

## Node order (happy path)

1. **Webhook**
2. **Edit Fields** (Set node) — normalises inbound payload
3. **Question Scoring / pillar weight** (Code node) — computes `scoring.*`
4. **banding / qual mapping** (Code node) — bands + qualitative copy mapping
5. **Radar chart URL** (Code node) — QuickChart radar URL
6. **Build PDF HTML** (Code node) — HTML for PDF pages
7. **Respond to Webhook** — returns HTML (debug)
8. **PDFShift** (HTTP) — HTML → PDF
9. **Extract from File** — extracts `pdf_base64`
10. **email** (Code node) — builds Resend JSON
11. **HTTP Request1** — sends email (Resend)
12. **HTTP Request** — pushes scores to GHL custom fields

## “Change impact” hotspots

- `Edit Fields`: renames break everything downstream.
- `Question Scoring / pillar weight`: qid/answer changes require map updates.
- `banding / qual mapping`: band/copy structure changes affect PDF.
- `Build PDF HTML`: expects `pillarInsights` + `banding.overallBand`.
