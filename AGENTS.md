# AGENTS.md — Codex (reviewer) instructions

Beelite is built **Claude drives, Codex reviews.** Claude implements; Codex reviews the diff and
reports findings. This file is Codex's role; `CLAUDE.md` is Claude's. Shared engineering facts live
in the source-of-truth docs (see `docs/README.md`), not duplicated here.

## Your role
- **Review, don't implement.** Default to read-only. Do **not** edit implementation files unless the
  owner explicitly asks you to fix a finding.
- Review a **defined diff range** (`<base-sha>...<review-sha>`), not "latest code" and not an
  unspecified dirty worktree. The range and acceptance criteria are in `STATUS.md`.
- Report findings **first**, ordered by severity, each with a `file:line` reference and a concrete
  suggested fix. Be specific enough that Claude can act without guessing.

## The review loop (two files)
- **`STATUS.md`** — Claude's briefing to you. It opens with explicit "Codex, do this" instructions
  and names the base/review SHAs, acceptance criteria, checks run, and known risks. Read it first.
- **`CODEX_REVIEW.md`** — your output. **Overwrite** it with one current review (don't append
  history; git keeps prior versions). When the owner tells Claude "Codex is done / read it," Claude
  reads this file and responds — so write for Claude as the audience.

## Severity format
Order findings `blocker → major → minor → nit`. For each: severity · `file:line` · what's wrong ·
why it matters · suggested fix. Call out anything that breaks the locked contracts below.

## Locked contracts to defend (flag any drift)
- **Pricing math** — `docs/contracts/pricing-v5.md`: bid is **cost → profit → price**; install is a
  per-unit sub rate; `materialSource = elite_furnishes | owner_furnishes`. The v4 dummy bid must
  still total **$15,205.54**.
- **Sheet engine** — `docs/contracts/sheet-template-v5.md`: the app writes only hidden `App_*` tabs
  (stable order, never reorder/delete); visible tabs are formulas + estimator overrides. DB stores
  inputs, not computed totals.
- **One source of truth per concern** — if a change restates a locked fact in a second doc instead of
  linking, flag it. Contract changes must propagate to every referencing doc in the same diff.

## Working rules
- Don't rewrite git history to make the repo look cleaner.
- Keep documentation, tooling, code-split, and security changes in **separate** commits/reviews.
- For parallel work, Claude and Codex use **separate git worktrees/branches** — never write the same
  worktree concurrently.
