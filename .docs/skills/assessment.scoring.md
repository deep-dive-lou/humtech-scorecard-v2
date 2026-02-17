# Assessment Scoring (v2) - Locked Logic Layer

This file is the authoritative scoring layer.
Only edit this if you intend to change logic.

## Bands (0-10 maturity)

- 0.0-4.9: Critical (Red)
- 5.0-6.9: Attention Required (Amber)
- 7.0-8.9: Average (Green)
- 9.0-10.0: Optimised (Dark Green)

These are implemented in the n8n node:
- `banding / qual mapping` (Code node)

## Pillar importance (overall weighting)

Implemented in the n8n node:
- `Question Scoring / pillar weight` (Code node)

```
leadEngagementSpeed:             0.22
appointmentReliabilityConversion:   0.22
operationalFocusTimeEfficiency:     0.22
systemsAutomationMaturity:          0.22
revenueProtectionLeakageControl:    0.12
```

## Question scoring map (0-5)

Implemented in:
- `Question Scoring / pillar weight` (Code node)

Key:
- Answer IDs are A/B/C/D/E/F (as submitted by the form).
- Any answer not mapped defaults to 0 (safe fallback).

IMPORTANT: If you add/remove answers, you must update the map in that node.

## Question -> pillar weights

Implemented in:
- `Question Scoring / pillar weight` (Code node)

Editing guidance:
- Keep weights per question summing to 1.0 across pillars (unless intentionally partial).
- Keep pillar list aligned with the `PILLARS` array in the node.
