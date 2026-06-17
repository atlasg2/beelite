import type { ProjectFinish, TakeoffLine, EstimateSettings } from "@prisma/client";

// In-app bid PREVIEW. Mirrors claude/sheet-template.md v4 (the Google Sheet stays
// the authoritative calculator; this is the read-only preview shown in the app).

export type BidLine = {
  code: string;
  takeoffQty: number;
  orderQty: number;
  materialTotal: number;
  installTotal: number;
  lineTotal: number;
  installMode: string;
};

export type BidResult = {
  lines: BidLine[];
  materialSubtotal: number;
  installSubtotal: number;
  subtotal: number;
  afterMarkup: number;
  freight: number;
  tax: number;
  bidTotal: number;
  warnings: string[];
};

export const DEFAULT_SETTINGS = {
  pricingMode: "markup",
  pct: 0.15,
  subMarkupPct: 0.15,
  taxPct: 0.08,
  taxMode: "total_sell_plus_freight",
  freight: 0,
};

type Settings = Pick<
  EstimateSettings,
  "pricingMode" | "pct" | "subMarkupPct" | "taxPct" | "taxMode" | "freight"
>;

export function computeBid(
  finishes: ProjectFinish[],
  takeoff: TakeoffLine[],
  settings: Settings | null
): BidResult {
  const s = (settings ?? DEFAULT_SETTINGS) as Settings;
  const warnings: string[] = [];
  const lines: BidLine[] = [];

  for (const f of finishes.filter((f) => f.inScope)) {
    const qty = takeoff
      .filter((t) => t.finishCode === f.code && t.status === "approved")
      .reduce((a, t) => a + t.qty, 0);

    const orderRaw = qty * (1 + (f.wastePct ?? 0));
    const carton = f.cartonSize ?? 0;
    const orderQty = carton > 0 ? Math.ceil(orderRaw / carton) * carton : orderRaw;

    const materialTotal = f.furnishType === "turnkey_sub" ? 0 : orderQty * (f.materialCost ?? 0);
    const amt = f.installAmount ?? 0;
    const installTotal =
      f.installMode === "unit_rate" ? qty * amt : f.installMode === "sub_quote" ? amt : 0;

    if (f.installMode === "pending") warnings.push(`${f.code}: install pending a sub quote`);
    if ((f.materialCost ?? 0) === 0 && f.furnishType !== "turnkey_sub")
      warnings.push(`${f.code}: no material cost set`);

    lines.push({
      code: f.code,
      takeoffQty: qty,
      orderQty,
      materialTotal,
      installTotal,
      lineTotal: materialTotal + installTotal,
      installMode: f.installMode,
    });
  }

  const materialSubtotal = lines.reduce((a, l) => a + l.materialTotal, 0);
  const installSubtotal = lines.reduce((a, l) => a + l.installTotal, 0);
  const subtotal = materialSubtotal + installSubtotal;

  const mark = (base: number, pct: number) =>
    s.pricingMode === "margin" ? base / (1 - pct) : base * (1 + pct);
  const materialAfter = mark(materialSubtotal, s.pct ?? 0);
  const installAfter = mark(installSubtotal, s.subMarkupPct ?? 0);
  const afterMarkup = materialAfter + installAfter;

  const freight = s.freight ?? 0;
  const taxPct = s.taxPct ?? 0;
  const taxBase =
    s.taxMode === "material_cost_only"
      ? materialSubtotal
      : s.taxMode === "material_sell_only"
        ? materialAfter
        : afterMarkup + freight;
  const tax = taxPct * taxBase;
  const bidTotal = afterMarkup + freight + tax;

  const needsReview = takeoff.filter((t) => t.status === "needs_review").length;
  if (needsReview) warnings.push(`${needsReview} takeoff row(s) still need review`);

  return { lines, materialSubtotal, installSubtotal, subtotal, afterMarkup, freight, tax, bidTotal, warnings };
}

export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
