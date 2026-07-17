# Curation rubric (Phase 3 AI agent)

> Last verified against code: 2026-07-17 (the agent is the PAI pipeline — `Personal-Assistant-AI` repo, `pipeline/portfolio.py`; weights mirrored in its `RUBRIC_WEIGHTS`)

Score each portfolio candidate 0–5 per criterion × weight. `priorityScore` = total (max 50).

| Criterion | Weight |
|---|---|
| Backend-career relevance | ×3 |
| Technical depth | ×3 |
| Completeness/professionalism (README/tests/CI) | ×2 |
| Uniqueness & impact | ×1.5 |
| Recent activity | ×0.5 |

## Decision

- ≥30 → propose.
- 20–29 → propose with notes.
- <20 → reject with reason.
- `featured` = only repos pinned via PAI's `PORTFOLIO_PIN` env; no automatic top-3
  (the owner toggles featured in `/admin`).

## Guardrails

- Only create/update **draft** entries with `source=ai`. Never publish or delete.
- Never touch `source=manual` entries.
- Base claims on README/metadata; if info is missing, write what needs clarifying — never invent.
