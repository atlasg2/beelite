# STATUS — the handoff file (read this first)

This single file is how **You ⇄ Claude ⇄ Codex** work together. Anyone reading it should know
exactly where we are and what to do next.

## How this works (the loop)
1. **Claude** drives — writes code/specs, then updates **Where we are** + **Claude proposes next** below.
2. **You tell Codex to review.** Codex reads this file + the latest commit, then **writes its take in
   the "Codex review" section** below (append; don't edit Claude's sections). Codex should: (a) review
   the files in *Review focus*, (b) give its own recommendation for the next step.
3. **You tell Claude to read this file.** Claude responds with what it thinks of Codex's notes.
4. **You decide.** Claude executes, then updates this file again. Repeat.

**Rules:** review against the **committed code** (latest commit below), not memory · keep entries
short · one source of truth per concern (see `CLAUDE.md`) · the whole product = the end-to-end flow
at the top of `docs/architecture.md`.

**Latest commit:** `d16b6b0`

---

## Where we are
**Step 2 of 8 — Prisma schema (written, not yet validated/pushed).**

| # | Step | State | Needs |
|---|---|---|---|
| 1 | Google Sheet template (from `claude/sheet-template.md` v4) | ☐ | your Google account |
| 2 | Prisma schema matching the sheet | ◑ written | Supabase |
| 3 | Project creation + Sheet copy | ☐ | Google service account |
| 4 | PDF upload + page tagging | ☐ | — |
| 5 | AI finish extraction | ☐ | Anthropic key |
| 6 | Confirm finishes + generate `App_Rates` | ☐ | — |
| 7 | Manual takeoff table | ☐ | — |
| 8 | Sync button → write `App_*` tabs | ☐ | Google service account |

---

## Claude proposes next
Do these in order — first one needs no accounts, so it can happen immediately:

1. **Claude (now, no accounts):** validate the schema — `npm install` runs `prisma generate`,
   which confirms `prisma/schema.prisma` compiles. Catches field/type mistakes before anything depends on it.
2. **You (Google account):** build the real Google Sheet from `claude/sheet-template.md` v4, type the
   dummy data, confirm **Bid Total $15,205.54**. This *proves the bid engine* and is the file the app copies.
3. **You (accounts):** create a Supabase project (for the DB push) and have the Anthropic key handy.
4. **Claude (next build):** step 3 — project creation + Sheet copy (the start of the sync keystone).

Rationale: the schema and the Sheet are the two foundations everything else conforms to; lock both
(validate schema, verify Sheet math) before building features on top.

## Review focus (for Codex, this round)
- `prisma/schema.prisma` vs `claude/sheet-template.md` v4 — field names/types match exactly?
- End-to-end flow (top of `docs/architecture.md`) — any product step missing or out of order?
- Sanity-check "Claude proposes next" — agree with the order, or is there a better next move?

## Out of scope
UI/screens, sync code, Sheet formula correctness (reviewed through v4).

---

## Codex review
*(Codex: append your review + your recommended next step here. Don't edit sections above.)*

— pending first review —

---

## Open questions
1. Adhesive/extras — Estimate columns now or defer past V1?
2. Per-line overrides on `Estimate` (overrides currently live only in `Rates`)?
3. Mixed markup modes (one `pricingMode` toggles both material & sub)?
