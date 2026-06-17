# Codex Review — Company Rate Library

Reviewed `STATUS.md` against latest committed code:
`d2d5c82`, `fba67a7`, `5583d84`, `684692f`, `0f0f7d5`, `4ce25ba`, `84273ae`, `2999022`.
Static review only; no build/tests run.

## Findings

1. **"Learn to library" can save incomplete `needs_rate` rows as standard rates.**
   `pushBidRatesToLibrary` skips only rows where both `installRate <= 0` and `materialUnitCost <= 0`
   (`app/actions.ts:218-220`). That means it will learn partially priced rows, for example
   Elite-furnished material with `materialUnitCost = 0` but `installRate > 0`, or owner-furnished rows
   with `installRate <= 0` if a stale/nonzero material cost is still present. Those rows become company
   standards and later seed bids as `rateStatus: "seeded"` even though the effective rate is still
   missing. Use the same effective needs-rate predicate as the bid calculator before publishing to the
   library: skip unless `(owner_furnishes && installRate > 0)` or
   `(elite_furnishes && materialUnitCost > 0 && installRate > 0)`.

2. **Library/rate saves still accept negative pricing inputs.**
   The client inputs for material, install, waste, and carton have no `min` guards
   (`components/library-editor.tsx:73-76`, `components/rates-editor.tsx:55-69`), and the server writes
   those numbers directly into `ProjectFinish` and `RateCatalogEntry` (`app/actions.ts:195-198`,
   `app/actions.ts:264-265`). A negative material cost, install rate, waste, or carton can be learned
   into the standard library and then seed future bids with negative cost/sell math. Clamp or reject
   these fields server-side, and mirror with UI `min="0"`; normalize owner-furnished material cost to
   `0` before saving.

3. **`saveLibrary` is a destructive full replace without a transaction or validation pass.**
   The action deletes everything not in the submitted code list before it upserts rows
   (`app/actions.ts:247-267`). If a later upsert fails, the library can be left partially deleted.
   Also, rows with duplicate codes silently last-write-win, while all-blank submitted rows produce
   `codes = []` and delete all existing library rows via the `["__none__"]` sentinel
   (`app/actions.ts:249-253`). The empty-library delete behavior is acceptable if intentional, but it
   should be explicit. Validate/normalize all rows first, reject duplicate nonblank codes, then run
   delete+upserts in a single `$transaction`.

## Checks That Look Correct

- Exact company-scoped code matching is implemented for seeding (`confirmFinishes` reads
  `companyId` and maps `FinishLibraryItem.code`), and no type/category fallback is auto-applied.
- The re-confirm behavior still preserves existing per-bid rates for unchanged finish codes, so
  library edits do not retroactively rewrite active bids.
- Owner-furnished rows with a valid install rate and zero material cost are supported by the current
  data model.
- The single-company helper (`getOrCreateDefaultCompany`) is consistent with the current v1 scope.

## Recommended Next Step

Tighten the save boundary: add one shared rate-normalization/validation helper, use it in
`saveRates`, `saveLibrary`, and `pushBidRatesToLibrary`, then wrap `saveLibrary`'s full-replace logic
in a transaction. After that, smoke-test three paths: direct library edit, learn-from-rates with an
owner-furnished finish, and confirm-finishes seeding from the learned standard.
