# Directories (what lives where)

## /docs
Top-level documentation.

### /docs/skills
Human-editable “source of truth” files used to generate changes safely.

- `assessment.copy.md` — questions, pillars, labels, qualitative copy blocks
- `assessment.scoring.md` — scoring maps + pillar weights + band thresholds
- `assessment.contract.md` — data contract for inputs/outputs (what code expects)

### /docs/operations
How to keep production stable when things change.

- `n8n.sync.md` — what to update in n8n when code/copy/form changes
- `release.checklist.md` — preflight checks for end-to-end flow
- `troubleshooting.md` — common failure modes and where to look

### /docs/directories
Reference lists / IDs / mapping tables.

- `question_ids.md` — canonical qids + answer ids
- `n8n.nodes.md` — node responsibilities and dependencies
