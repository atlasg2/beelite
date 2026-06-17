# Codex Review — UX / IA Redesign Proposal

Reviewed `STATUS.md` against latest committed code:
`ae264a2`, `a1698a4`, `540a91f`, `09afba4`, `d2d5c82`, `fba67a7`, `5583d84`, `684692f`.
Static proposal review only; no build/tests run.

## Findings

1. **The workspace direction is right, but it needs a single workflow/status model first.**
   The current project page derives local state inline (`hasPlan`, `finishCount`, `hasTakeoff`, bid
   total) and separately stacks tool sections (`app/projects/[id]/page.tsx:19-33`,
   `app/projects/[id]/page.tsx:58-149`). The Bid page has its own warning source via `computeBid`.
   If the redesign adds a left rail, overview dashboard, and stage headers without one shared
   `deriveProjectWorkflow(project)`/workspace query, the stepper counts will drift from the actual
   bid warnings. Build the workspace shell around one status object: Plans tagged/read, Finishes
   confirmed, Rates complete using the same `needsRate` predicate, Takeoff approved/nonempty, Scope
   set, Bid ready/synced.

2. **Do not implement the Plans thumbnail rail by eagerly calling the existing preview endpoint.**
   `/api/preview` downloads the whole PDF and renders one page per request (`app/api/preview/route.ts:17-21`);
   `renderPage` loads the PDF and rasterizes at scale `1.6` (`lib/pdf.ts:76-87`). That is fine for the
   current one-page-on-click preview, but a thumbnail list for a 108-page plan would hammer storage and
   PDF rendering if every thumbnail is mounted at once. The viewer should lazy/virtualize thumbnails,
   render low-res thumbs separately from the selected large page, and cache previews more deliberately.

3. **Fix sheet labels as presentation first; be cautious about tightening scanner rules.**
   The proposal is correct that Page N should be primary. Current UI still shows the scanner's
   `sheetNumber` in the main "Sheet" column (`components/pages-tagger.tsx:57-74`), and the scanner
   just takes the first regex match from page text (`lib/pdf.ts:12-13`, `lib/pdf.ts:40-42`). Make
   `Page 7`/`Page 33` the stable identifier and label `sheetNumber` as "scanner guess." Tightening the
   regex can help, but do not make a sheet-number match required for classification; broken fonts and
   odd plan title blocks are already part of the real sample set.

4. **"Source-page link" on Finishes is not currently a no-data-change UI feature.**
   `ExtractedFinish` has no per-finish source page field (`lib/anthropic.ts:7-16`). The action stores
   only the extraction-level `sourcePages` list (`app/actions.ts:131-135`). For this IA pass, either
   make the Finishes link point to the tagged schedule page set / selected preview, or explicitly add
   per-finish provenance as a later data/API change. Otherwise the UI will imply precision the data
   does not have.

5. **The two-pane shell needs a mobile/collapsed mode in the plan, not after the fact.**
   The current app is centered around a `760px` `.wrap` and several horizontally scrolling tables
   (`app/globals.css:38-42`, `components/takeoff-editor.tsx`, `components/rates-editor.tsx`). A
   persistent left rail plus wide stage tables will not naturally fit smaller screens. Define the
   desktop shell as rail + stage pane, but collapse the rail into a top stepper/summary drawer on
   narrow viewports before styling each stage.

## Checks That Look Correct

- Moving from a flat project detail dump to a guided project workspace addresses the real product
  problem: users need to know "where am I, what is blocked, what is next."
- Keeping Standard rates outside the project workspace is correct; it is company-level data, not a
  bid stage.
- Putting Scope before Bid in the pipeline is correct now that scope/exclusions feed the proposal
  sheet assumptions.
- The visual direction is appropriate for an estimating tool. Implement tabular numerals globally
  for money/quantity surfaces, then apply the new palette; do not start with paint before the shell.

## Recommended Next Step

Build phase 1 as a thin structural slice: create a shared `ProjectWorkspace` shell plus a central
workflow-status helper, wrap one existing stage without redesigning its internals, and make the rail
show real blocking counts from that helper. Once that is stable, build the Plans viewer as the first
deep stage because it solves the user's most painful current screen.
