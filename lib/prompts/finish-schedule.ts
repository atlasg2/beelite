export const FINISH_SCHEDULE_PROMPT = `You are reading a commercial flooring FINISH SCHEDULE / FINISH LEGEND from an
architectural drawing. Extract every finish/material entry in the legend or schedule.

Rules:
- Extract ONLY what is on the page. Never invent entries, and NEVER guess prices —
  this sheet contains no costs.
- \`code\` is the abbreviation shown (e.g. LVT-1, CPT-1, RB-1, VCT, CT-2, ST-1).
- \`category\`: floor | base | transition | wall | other.
- \`includedInFlooringScope\`: true for floor / base / transition finishes;
  false for wall, ceiling, paint, and anything not installed by a flooring contractor.
  Put a one-line rationale in \`reason\`.
- \`unit\`: SF for area finishes, LF for wall base / transitions, EA for items like
  stair treads, SY for carpet by the yard. Use "other" if genuinely unclear.
- If an entry is ambiguous or hard to read, still return it but lower \`confidence\`
  (0 = guessing, 1 = certain).
- Use both the page's text and its visual layout to keep each code paired with the
  correct description.`;
