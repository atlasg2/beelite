/**
 * Beelite Google Sheet "bid engine" — reusable builder.
 *
 * Structure (9 tabs, formulas, named ranges) is identical to scripts/build-sheet-template.ts
 * (verified against claude/sheet-template.md v4 → Bid Total $15,205.54). This module is what the
 * app uses at runtime to create + populate a fresh Sheet per bid in the connected user's Drive.
 *
 * The Sheet does the math. We only push the bid's INPUTS into the hidden App_* tabs; the visible
 * Estimate/Rates/Summary tabs compute live from there.
 */
import type { sheets_v4 } from "googleapis";

const N = 60; // fill-down rows for formula tabs

// stable sheetIds so we can hide tabs / build named ranges
const ID = {
  Summary: 10,
  Estimate: 11,
  Rates: 12,
  Assumptions: 13,
  App_Finishes: 20,
  App_Takeoff: 21,
  App_Scope: 22,
  App_Rates: 23,
  App_Settings: 24,
};

const MY_TABS = [
  { sheetId: ID.Summary, title: "Summary" },
  { sheetId: ID.Estimate, title: "Estimate" },
  { sheetId: ID.Rates, title: "Rates" },
  { sheetId: ID.Assumptions, title: "Assumptions" },
  { sheetId: ID.App_Finishes, title: "App_Finishes", hidden: true },
  { sheetId: ID.App_Takeoff, title: "App_Takeoff", hidden: true },
  { sheetId: ID.App_Scope, title: "App_Scope", hidden: true },
  { sheetId: ID.App_Rates, title: "App_Rates", hidden: true },
  { sheetId: ID.App_Settings, title: "App_Settings", hidden: true },
];

// Bump relative row refs ($A2 -> $A{r}); leaves absolute ($A$2) and ranges untouched.
const rowF = (tpl: string, r: number) => tpl.replace(/\$([A-Z]+)2\b/g, (_m, c) => `$${c}${r}`);

function fillBlock(colTemplates: string[], rows: number): (string | number)[][] {
  const out: (string | number)[][] = [];
  for (let r = 2; r < 2 + rows; r++) {
    out.push(colTemplates.map((t) => (t === "" ? "" : rowF(t, r))));
  }
  return out;
}

// ── Formula tabs (identical to the verified template) ─────────
const ratesHeader = [
  "code", "defaultMaterialCost", "overrideMaterialCost", "effectiveMaterialCost",
  "defaultInstallMode", "overrideInstallMode", "effectiveInstallMode",
  "defaultInstallAmount", "overrideInstallAmount", "effectiveInstallAmount",
  "defaultWastePct", "overrideWastePct", "effectiveWastePct",
  "defaultCartonSize", "overrideCartonSize", "effectiveCartonSize",
  "defaultFurnishType", "overrideFurnishType", "effectiveFurnishType", "notes",
];
const ratesBtoT = [
  '=IF($A2="","",XLOOKUP($A2,App_Rates!$A:$A,App_Rates!$B:$B,0))',
  "",
  '=IF($A2="","",IF($C2<>"",$C2,$B2))',
  '=IF($A2="","",XLOOKUP($A2,App_Rates!$A:$A,App_Rates!$C:$C,"pending"))',
  "",
  '=IF($A2="","",IF($F2<>"",$F2,$E2))',
  '=IF($A2="","",XLOOKUP($A2,App_Rates!$A:$A,App_Rates!$D:$D,0))',
  "",
  '=IF($A2="","",IF($I2<>"",$I2,$H2))',
  '=IF($A2="","",XLOOKUP($A2,App_Rates!$A:$A,App_Rates!$E:$E,0))',
  "",
  '=IF($A2="","",IF($L2<>"",$L2,$K2))',
  '=IF($A2="","",XLOOKUP($A2,App_Rates!$A:$A,App_Rates!$F:$F,0))',
  "",
  '=IF($A2="","",IF($O2<>"",$O2,$N2))',
  '=IF($A2="","",XLOOKUP($A2,App_Rates!$A:$A,App_Rates!$G:$G,"furnish_and_sub"))',
  "",
  '=IF($A2="","",IF($R2<>"",$R2,$Q2))',
  "",
];

const estHeader = [
  "Finish", "Description", "Unit", "Takeoff Qty", "Waste %", "Order Qty (raw)",
  "Carton size", "Order Qty (rounded)", "Material $/unit", "Material Total",
  "Install mode", "Install amount", "Install (sub) Total", "Line Total", "Furnish type",
];
const estBtoO = [
  '=IF($A2="","",XLOOKUP($A2,App_Finishes!$A:$A,App_Finishes!$C:$C,""))',
  '=IF($A2="","",XLOOKUP($A2,App_Finishes!$A:$A,App_Finishes!$D:$D,""))',
  '=IF($A2="","",SUMIFS(App_Takeoff!$D:$D,App_Takeoff!$C:$C,$A2,App_Takeoff!$F:$F,"approved"))',
  '=IF($A2="","",XLOOKUP($A2,Rates!$A:$A,Rates!$M:$M,0))',
  '=IF($A2="","",$D2*(1+$E2))',
  '=IF($A2="","",XLOOKUP($A2,Rates!$A:$A,Rates!$P:$P,0))',
  '=IF($A2="","",IF($G2>0,CEILING($F2,$G2),$F2))',
  '=IF($A2="","",XLOOKUP($A2,Rates!$A:$A,Rates!$D:$D,0))',
  '=IF($A2="","",IF($O2="turnkey_sub",0,$H2*$I2))',
  '=IF($A2="","",XLOOKUP($A2,Rates!$A:$A,Rates!$G:$G,"pending"))',
  '=IF($A2="","",XLOOKUP($A2,Rates!$A:$A,Rates!$J:$J,0))',
  '=IF($A2="","",IFS($K2="unit_rate",$D2*$L2,$K2="sub_quote",$L2,$K2="pending",0))',
  '=IF($A2="","",$J2+$M2)',
  '=IF($A2="","",XLOOKUP($A2,Rates!$A:$A,Rates!$S:$S,"furnish_and_sub"))',
];

const bidBlock: [string, string][] = [
  ["Subtotal", "=SUM(N2:N)"],
  ["Material subtotal", "=SUM(J2:J)"],
  ["Sub-install subtotal", "=SUM(M2:M)"],
  ["Pricing mode", "=App_Settings!$B$5"],
  ["Material pct", "=App_Settings!$B$6"],
  ["Sub markup pct", "=App_Settings!$B$11"],
  ["Material after", '=IF($R$4="margin",$R$2/(1-$R$5),$R$2*(1+$R$5))'],
  ["Sub after", '=IF($R$4="margin",$R$3/(1-$R$6),$R$3*(1+$R$6))'],
  ["After markup/margin", "=$R$7+$R$8"],
  ["Freight", "=App_Settings!$B$9"],
  ["Tax mode", "=App_Settings!$B$8"],
  ["Tax %", "=App_Settings!$B$7"],
  ["Tax", '=$R$12*IFS($R$11="material_cost_only",$R$2,$R$11="material_sell_only",$R$7,$R$11="total_sell_plus_freight",$R$9+$R$10)'],
  ["BID TOTAL", "=$R$9+$R$10+$R$13"],
];

const RNG = "$2:$1000";
const summary: [string, string][] = [
  ["Project", "=App_Settings!$B$1"],
  ["GC", "=App_Settings!$B$2"],
  ["Location", "=App_Settings!$B$3"],
  ["Bid date", "=App_Settings!$B$4"],
  ["Bid Total", "=Estimate!$R$14"],
  ["! Install items pending sub quote", '=COUNTIF(Estimate!$K$2:$K,"pending")'],
  ["! Furnish lines missing material cost", '=COUNTIFS(Estimate!$A$2:$A,"<>",Estimate!$I$2:$I,0,Estimate!$O$2:$O,"furnish_and_sub")'],
  ["! Install amount missing (not pending)", '=COUNTIFS(Estimate!$A$2:$A,"<>",Estimate!$L$2:$L,0,Estimate!$K$2:$K,"<>pending")'],
  ["! Takeoff rows needs_review", '=COUNTIF(App_Takeoff!$F$2:$F,"needs_review")'],
  ["! Takeoff code not in finishes", `=SUMPRODUCT((App_Takeoff!$C${RNG}<>"")*(COUNTIF(App_Finishes!$A:$A,App_Takeoff!$C${RNG})=0))`],
  ["! Duplicate finish codes", `=SUMPRODUCT((App_Finishes!$A${RNG}<>"")*(COUNTIF(App_Finishes!$A${RNG},App_Finishes!$A${RNG}&"")>1))`],
  ["! Duplicate rate codes", `=SUMPRODUCT((App_Rates!$A${RNG}<>"")*(COUNTIF(App_Rates!$A${RNG},App_Rates!$A${RNG}&"")>1))`],
];

const NAMED = [
  { name: "app_finishes", sheetId: ID.App_Finishes, startRowIndex: 1, endColumnIndex: 6 },
  { name: "app_takeoff", sheetId: ID.App_Takeoff, startRowIndex: 1, endColumnIndex: 6 },
  { name: "app_scope", sheetId: ID.App_Scope, startRowIndex: 1, endColumnIndex: 3 },
  { name: "app_rates", sheetId: ID.App_Rates, startRowIndex: 1, endColumnIndex: 7 },
  { name: "app_settings", sheetId: ID.App_Settings, startRowIndex: 0, endRowIndex: 11, startColumnIndex: 1, endColumnIndex: 2 },
];

// ── Bid → App_* tables ────────────────────────────────────────
type Cell = string | number;

export interface BidInput {
  name: string;
  gc: string | null;
  location: string | null;
  bidDate: Date | null;
  notes: string | null;
  finishes: {
    code: string; type: string; description: string; unit: string; category: string;
    inScope: boolean; materialCost: number; installMode: string; installAmount: number | null;
    wastePct: number; cartonSize: number | null; furnishType: string;
  }[];
  takeoff: { sheet: string | null; area: string; finishCode: string; qty: number; unit: string; status: string }[];
  scopeItems: { label: string; mode: string; allowance: number | null }[];
  settings: {
    pricingMode: string; pct: number; subMarkupPct: number;
    taxPct: number | null; taxMode: string; freight: number | null;
  } | null;
}

function ymd(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

/** Map a bid into the five App_* tab grids (header row + data rows). */
export function bidToTables(bid: BidInput) {
  const appFinishes: Cell[][] = [
    ["code", "type", "description", "unit", "category", "inScope"],
    ...bid.finishes.map((f) => [
      f.code, f.type, f.description, f.unit, f.category, f.inScope ? "TRUE" : "FALSE",
    ]),
  ];

  // Rates only for in-scope finishes — they're what the Estimate prices.
  const appRates: Cell[][] = [
    ["code", "materialCost", "installMode", "installAmount", "wastePct", "cartonSize", "furnishType"],
    ...bid.finishes
      .filter((f) => f.inScope)
      .map((f) => [
        f.code, f.materialCost, f.installMode,
        f.installAmount ?? 0, f.wastePct, f.cartonSize ?? 0, f.furnishType,
      ]),
  ];

  const appTakeoff: Cell[][] = [
    ["sheet", "area", "finishCode", "qty", "unit", "status"],
    ...bid.takeoff.map((t) => [t.sheet ?? "", t.area, t.finishCode, t.qty, t.unit, t.status]),
  ];

  const appScope: Cell[][] = [
    ["label", "mode", "allowance"],
    ...bid.scopeItems.map((s) => [s.label, s.mode, s.allowance ?? ""]),
  ];

  const s = bid.settings;
  const appSettings: Cell[][] = [
    ["projectName", bid.name],
    ["gc", bid.gc ?? ""],
    ["location", bid.location ?? ""],
    ["bidDate", ymd(bid.bidDate)],
    ["pricingMode", s?.pricingMode ?? "markup"],
    ["pct", s?.pct ?? 0.15],
    ["taxPct", s?.taxPct ?? 0],
    ["taxMode", s?.taxMode ?? "total_sell_plus_freight"],
    ["freight", s?.freight ?? 0],
    ["notes", bid.notes ?? ""],
    ["subMarkupPct", s?.subMarkupPct ?? s?.pct ?? 0.15],
  ];

  return { appFinishes, appRates, appTakeoff, appScope, appSettings };
}

type Tables = ReturnType<typeof bidToTables>;

// App_* value writes (data only — headers included, formula tabs untouched).
function appData(t: Tables) {
  return [
    { range: "App_Finishes!A1", values: t.appFinishes },
    { range: "App_Rates!A1", values: t.appRates },
    { range: "App_Takeoff!A1", values: t.appTakeoff },
    { range: "App_Scope!A1", values: t.appScope },
    { range: "App_Settings!A1", values: t.appSettings },
  ];
}

// Formula-tab writes (structure — only on first build).
function formulaData() {
  return [
    { range: "Rates!A1", values: [ratesHeader] },
    { range: "Rates!A2", values: [['=IFERROR(App_Rates!$A$2:$A,"")']] },
    { range: "Rates!B2", values: fillBlock(ratesBtoT, N) },
    { range: "Estimate!A1", values: [estHeader] },
    { range: "Estimate!A2", values: [['=IFERROR(UNIQUE(FILTER(App_Finishes!$A$2:$A,App_Finishes!$F$2:$F=TRUE)),"")']] },
    { range: "Estimate!B2", values: fillBlock(estBtoO, N) },
    { range: "Estimate!Q1", values: bidBlock.map(([l, f]) => [l, f]) },
    { range: "Summary!A1", values: summary.map(([l, f]) => [l, f]) },
    { range: "Assumptions!A1", values: [["Assumptions (auto from scope — do not edit)", "", "Manual notes (type here)"]] },
    { range: "Assumptions!A2", values: [['=IFERROR(FILTER(App_Scope!$A$2:$A&" — "&App_Scope!$B$2:$B&IF(App_Scope!$C$2:$C<>""," (allowance $"&App_Scope!$C$2:$C&")",""),App_Scope!$A$2:$A<>""),"")']] },
  ];
}

type Sheets = sheets_v4.Sheets;

/**
 * Create a fresh Bid Engine spreadsheet in the connected user's Drive and populate it.
 * Returns the new spreadsheet id + url. Uses spreadsheets.create (the user owns Drive storage,
 * unlike a service account), so no template copy is needed.
 */
export async function createBidSpreadsheet(sheets: Sheets, bid: BidInput) {
  const tables = bidToTables(bid);

  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: `Beelite — ${bid.name}` },
      sheets: MY_TABS.map((t) => ({
        properties: { sheetId: t.sheetId, title: t.title, hidden: !!t.hidden },
      })),
    },
  });
  const spreadsheetId = created.data.spreadsheetId!;
  const url = created.data.spreadsheetUrl!;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "USER_ENTERED", data: [...formulaData(), ...appData(tables)] },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: NAMED.map((n) => ({
        addNamedRange: {
          namedRange: {
            name: n.name,
            range: {
              sheetId: n.sheetId,
              startRowIndex: n.startRowIndex,
              endRowIndex: n.endRowIndex,
              startColumnIndex: n.startColumnIndex ?? 0,
              endColumnIndex: n.endColumnIndex,
            },
          },
        },
      })),
    },
  });

  return { spreadsheetId, url };
}

/**
 * Re-push a bid's inputs into an existing Bid Engine sheet. Clears old App_* data first so
 * removed rows don't linger, then writes the current grids. Formula tabs are left untouched.
 */
export async function updateBidData(sheets: Sheets, spreadsheetId: string, bid: BidInput) {
  const tables = bidToTables(bid);

  await sheets.spreadsheets.values.batchClear({
    spreadsheetId,
    requestBody: {
      ranges: [
        "App_Finishes!A2:Z1000",
        "App_Rates!A2:Z1000",
        "App_Takeoff!A2:Z1000",
        "App_Scope!A2:Z1000",
        "App_Settings!A1:B1000",
      ],
    },
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "USER_ENTERED", data: appData(tables) },
  });
}
