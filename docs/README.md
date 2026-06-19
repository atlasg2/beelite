# Docs index

One row per document, with its status and what concern it owns. **Only one doc may be _controlling_
for a given concern** (see CLAUDE.md's source-of-truth map). Status vocabulary: **controlling**
(the single source of truth for its concern) · **active** (current, but not the sole authority) ·
**proposal** (under review, not adopted) · **archive** (superseded; kept for history).

_Last reconciled: 2026-06-19._

## Controlling — the source-of-truth set

| Doc | Concern | Status |
|---|---|---|
| [v1-plan.md](v1-plan.md) | Product: what/why/scope | controlling |
| [architecture.md](architecture.md) | Technical wiring (stack, schema, sync, prompts) | controlling |
| [contracts/sheet-template-v5.md](contracts/sheet-template-v5.md) | Google Sheet bid engine — tab/field map | controlling |
| [contracts/pricing-v5.md](contracts/pricing-v5.md) | Bid math contract (cost → profit → price) | controlling |
| [../STATUS.md](../STATUS.md) | Where we are / Codex review handoff | controlling |
| [../CLAUDE.md](../CLAUDE.md) | Claude operating memory + source-of-truth map | controlling |

## Active references

| Doc | Concern | Status |
|---|---|---|
| [nola-portal-scraping.md](nola-portal-scraping.md) | How to pull plan PDFs from the NOLA OneStop portal (the `Redirect → PrmtView → GetDocument` recipe; mirrored in `lib/nola-portal.ts`) | active |
| [read-notes.md](read-notes.md) | Finish-extraction eval evidence (label with date + model) | active |
| [takeoff-measurement-proposal.md](takeoff-measurement-proposal.md) | Design for the SF-quantity / takeoff problem | proposal |
| [repository-cleanup-proposal.md](repository-cleanup-proposal.md) | Repo cleanup + Claude/Codex workflow plan (this round) | proposal |

## Needs owner triage

These predate the current flow and may overlap or be stale. **Audit for any decision not already
captured in a controlling doc, then archive** (move to `archive/2026-06/`) or delete:

| Doc | Note |
|---|---|
| [estimator-plan.md](estimator-plan.md) | Retain only still-current execution steps |
| [estimate-flow-spec.md](estimate-flow-spec.md) | Likely superseded by architecture.md + contracts |
| [estimator-workflow.md](estimator-workflow.md) | Likely superseded |
| [pipeline-strategy.md](pipeline-strategy.md) | Likely superseded |
| [final-proposal.md](final-proposal.md) | Older proposal; consolidate then archive |
| [codex-estimator-pipeline-proposal.md](codex-estimator-pipeline-proposal.md) | Codex proposal; consolidate then archive |
| [codex-final-estimator-proposal.md](codex-final-estimator-proposal.md) | Codex proposal; consolidate then archive |
| [current-process.md](current-process.md) | Untracked; disagrees with the schema — reverify line-by-line or discard, don't ship as "current" |

## Assets

`assets/` holds loose UI/design images (renamed from anonymous hashes during the 2026-06 cleanup).
They are currently **unreferenced** — owner to either link them from an active doc or delete.
Third-party sample plan sets live in the git-ignored `samples/`, never under `docs/`.
