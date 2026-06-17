# STATUS — single briefing & review file

## 📋 CODEX — when you're told "read STATUS.md", do exactly this (no other context needed):
1. **Ignore your prior session memory.** THIS FILE is the complete, current truth. If something
   isn't in this file, it is not current.
2. **Review** the proposal in the **"Current review focus"** section below, checking it against the
   latest committed code (`git log --oneline -8`).
3. **Write your review** — findings + one recommended next step — into **`CODEX_REVIEW.md`**
   (overwrite that file; it only ever holds the current review). **Do NOT edit STATUS.md.**

That's the whole job. You do not need anything else.

> ⛔ **Removed / out of scope — do NOT review or bring up:** NOLA permit data, SAM.gov lead-sourcing
> (deleted), and lead-generation/prospecting in general. Abandoned side-quest, not part of the product.

## What Beelite is
A commercial flooring **takeoff & estimating** app. Upload plans → AI reads the finish schedule →
review/confirm finishes → set rates → enter a room-level takeoff → get a bid. The Google Sheet is
the authoritative bid calculator; the app is the capture/review/sync layer.
Stack: Next.js + Supabase (Postgres + storage) + Prisma + Anthropic API + Google Sheets.

---

## How we work (the loop)
1. **Claude** drives — writes code, updates this file.
2. **You tell Codex to review** → Codex reads THIS file + the latest commits, appends its review in
   the **Codex review** section below (current round only).
3. **You tell Claude "read STATUS"** → Claude responds, then executes.
4. Claude clears resolved reviews so this file stays a clean snapshot. History lives in git.

**Latest commits:** run `git log --oneline -8`. Review against the committed code, not memory.

---

## Where we are — full plan→bid loop works in-app ✅
| # | Step | State |
|---|---|---|
| 1 | Google Sheet bid-engine template (`claude/sheet-template.md` v4) | ☑ built + verified $15,205.54 |
| 2 | Prisma schema → Supabase | ☑ pushed (session pooler) |
| 3 | Project creation (home ledger + `/projects/new`) | ☑ |
| 4 | PDF upload + **page-targeting** (scan every page → Pages screen → tag → preview) | ☑ scan finds schedule pages free (gym pp 4/7/33) |
| 5 | AI finish extraction in app — **targeted** (only tagged pages, `pdf-lib` split) + `/finishes` review/confirm + `Extraction` log | ☑ ~$0.06–0.18/bid |
| 6 | Rates per finish (`/rates`) | ☑ |
| 7 | Room-level takeoff (`/takeoff`) | ☑ |
| 8 | In-app bid preview (`/estimate`, `lib/estimate.ts` mirrors the Sheet math) | ☑ |
| 9 | Google OAuth connect (`GoogleConnection`, `/api/auth/google[/callback]`, home status card) | ☑ connected |
| 9b | **Sync → Google Sheet** — creates a fresh Bid Engine sheet per bid in the user's Drive + re-sync | ☑ verified $15,205.54 via OAuth create |
| 10 | Visual polish | ☐ (last) |

**Sample bids seeded** (real public plans, in the DB): Midlands (1pg), Newport News (26pg),
PJHS (73pg), **DC Youth gym (108pg)**. Files in `samples/` (gitignored).

---

## Recently shipped — page-targeting (Codex-reviewed, built as agreed)
Scan every page on upload → `PlanSheet` per page (scanScore/scanSignals/suggestedSheetType, separate
from human-confirmed sheetType) → **Pages screen** (`/projects/[id]/pages`): list + suggested tags +
on-demand preview (`/api/preview`) → tag → **targeted extraction** on only tagged pages (`pdf-lib`
split, one Claude call). Verified: gym 108pg renders previews; scan pre-flags pp 4/7/33.

## Codex review of the implementation → ADDRESSED (commit `f1db7be`)
Fixed: #1 correction-log bug (confirmFinishes updates the exact extraction; one extraction per
document, stale cleared) · #2 multi-document routing (explicit `?doc=`) · #3 tag default
(non-suggestions stay untagged) · #5 rescan action + buttons · #6 finish-code regex (1–2 digits) +
a stateful-regex bug. Deferred: #4 preview caching (fine for demo).

## Recently shipped — Google Sheet sync (Phase 2)
Chose **OAuth** (user connects their Google; `drive.file` scope) over service account — a SA on
personal Gmail has zero Drive quota and can't create files. Flow: `/estimate` → "Sync to Google
Sheet" (`SyncSheetButton`) → `syncBidToSheet` action → `getAuthedClient()` → `createBidSpreadsheet()`
in `lib/sheet-builder.ts` builds a fresh 9-tab Bid Engine sheet in the user's Drive, pushes the bid's
inputs into the hidden `App_*` tabs, saves `project.sheetId`. Re-sync → `updateBidData()` (clears +
rewrites `App_*`, formula tabs untouched). `lib/sheet-builder.ts` is the verified template structure
(`scripts/build-sheet-template.ts`) refactored into reusable create/update fns — **same formulas**.
Proven end-to-end: `tsx --env-file=.env scripts/test-sync.ts` created a real sheet via OAuth and read
back **$15,205.54** (then deleted it).

## Current review focus → Phase 2 Google Sheet sync
Review `lib/sheet-builder.ts`, `syncBidToSheet` in `app/actions.ts`, `components/sync-sheet-button.tsx`,
and `lib/google.ts` against `git log --oneline -8`. Things worth a look: (a) single-row
`GoogleConnection` model — fine for one-user demo, but is the "reuse if `sheetId` exists, else
recreate" logic in `syncBidToSheet` sound (e.g. sheet trashed vs. permission revoked)? (b) `App_*`
clear-then-write in `updateBidData` — any race / partial-write risk? (c) settings row-order coupling
(`App_Settings` rows must match the named range + Estimate `$B$N` refs).

## Next (no review needed)
- **Step 10 — visual polish** (last).
- Later: Workspace Shared Drive as the production path once Google verification finishes.

---

## Codex's review goes in `CODEX_REVIEW.md`, NOT here
This file is Claude's briefing. Codex writes its review to **`CODEX_REVIEW.md`** (overwrite it).
Claude reads that file when the user says the review is done.
