# Codex Review — Page-Targeting Implementation

Reviewed `STATUS.md` against latest committed code:
`1dfbfd0`, `a25c6bc`, `ca95a28`, `ad0e02b`, `52bf141`, `6c05a1a`, `505d50b`, `068a968`.
Static review only; no build/tests run.

## Findings

1. **Corrections can be written to the wrong page, or not written at all.**
   `readSchedule` stores the extraction on the first tagged schedule page (`app/actions.ts:96`-`102`),
   but `confirmFinishes` later looks up the last `finish_schedule` page by `id` and updates that page's
   extraction (`app/actions.ts:110`-`117`). With multiple tagged schedule pages, this often will not be
   the same `PlanSheet`, so the update fails and is swallowed by `.catch(() => {})`. Result: the bid
   can save confirmed finishes while the correction log loses the human correction. Also, if tags change
   and a new extraction is created on a different page, old extractions are not cleared, and `/finishes`
   picks the lowest page with any extraction (`app/projects/[id]/finishes/page.tsx:16`-`20`), which can
   show stale results.

2. **Multiple uploaded PDFs can route the user to the wrong document.**
   The bid page lists documents newest-first, but every document's Pages button links to the same
   `/projects/[id]/pages` URL (`app/projects/[id]/page.tsx:22`, `app/projects/[id]/page.tsx:79`-`80`).
   The Pages screen then orders documents oldest-first and uses `project.documents[0]`
   (`app/projects/[id]/pages/page.tsx:14`-`18`). The Finishes screen also uses `project.documents[0]`
   for `readSchedule`, while counting tagged pages project-wide (`app/projects/[id]/finishes/page.tsx:25`-`28`,
   `app/projects/[id]/finishes/page.tsx:51`). On a project with more than one uploaded plan, the user
   can tag one document but read another, or click Pages on the newest upload and see the oldest one.

3. **Suggested tags are still being promoted to confirmed tags too easily.**
   `PagesTagger` initializes the dropdown state from `suggestedSheetType` whenever `sheetType` is
   `untagged` (`components/pages-tagger.tsx:21`-`23`), and both Save and Read persist every dropdown
   value (`components/pages-tagger.tsx:28`-`35`). That means simply opening the screen and clicking Save
   or Read turns scanner guesses into human-confirmed tags, and untagged non-suggestions become `ignore`.
   The schema separates suggested vs confirmed state, but the UI collapses that distinction on first save.

4. **Preview rendering will be expensive on large plan sets.**
   `/api/preview` downloads the full PDF from storage and renders the requested page on every uncached
   preview request (`app/api/preview/route.ts:17`-`21`). Browser caching helps after the first render of
   the same page, but browsing many pages of a 108-page set still means repeated full-PDF downloads and
   renders. Fine for a demo, but this should be cached or pre-rendered for regular use.

5. **Upload-time scanning is synchronous and has no recovery path beyond re-upload.**
   `uploadDocument` uploads the PDF, creates the document, then scans every page inside the server action
   (`app/actions.ts:45`-`67`). If a 108-page scan is slow, upload feels stuck; if scanning fails, the
   document remains with no pages and the UI tells the user to re-upload. A manual "rescan" action or
   background scan state would make this safer.

6. **The heuristic is a good start but still misses real formats.**
   `FINISH_CODE` only matches one trailing digit (`lib/pdf.ts:12`), so codes like `LVT-10`, `CPT-12`,
   or `RB-01` will not count toward density. The status note that PJHS flagged none also suggests spec
   sections need stronger signals than schedule-title detection alone.

## Recommended Next Step

Fix the extraction/document ownership model before moving to Sheet sync: make Pages/Finishes operate on
an explicit `documentId`, store or identify a single current extraction for the tagged-page set, update
that exact extraction during `confirmFinishes`, and clear or supersede stale extractions when tags change
or extraction reruns. After that, tune tag confirmation and preview/scan performance.
