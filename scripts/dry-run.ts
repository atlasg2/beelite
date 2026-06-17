/**
 * Real end-to-end dry run on a real plan: scan → AI extract → confirm (library auto-fill) → bid →
 * synced v5 Sheet. Leaves a navigable project in the app. Takeoff quantities are PLACEHOLDER (the
 * one human step) so the bid math flows. Run: tsx --env-file=.env scripts/dry-run.ts
 */
import { readFileSync } from "fs";
import { google } from "googleapis";
import { db } from "@/lib/db";
import { getOrCreateDefaultCompany } from "@/lib/company";
import { uploadPlan } from "@/lib/storage";
import { scanPdf, extractPages } from "@/lib/pdf";
import { extractFinishSchedule } from "@/lib/anthropic";
import { computeBid, usd, pct } from "@/lib/estimate";
import { getAuthedClient } from "@/lib/google";
import { createBidSpreadsheet, type BidInput } from "@/lib/sheet-builder";

const PLAN = process.env.PLAN || "samples/dc-youth-gym.pdf";

async function main() {
  const company = await getOrCreateDefaultCompany();
  const bytes = readFileSync(PLAN);
  console.log(`\n▶ Dry run on ${PLAN} (${(bytes.length / 1e6).toFixed(1)} MB)\n`);

  // 1) scan every page, pick the finish-schedule pages (what the scanner suggests, else top scores)
  const scans = await scanPdf(bytes);
  let pages = scans.filter((s) => s.suggestedSheetType === "finish_schedule").map((s) => s.pageNumber);
  if (!pages.length) pages = [...scans].sort((a, b) => b.score - a.score).slice(0, 3).map((s) => s.pageNumber).sort((a, b) => a - b);
  console.log(`① Scanned ${scans.length} pages → finish-schedule pages: ${pages.join(", ")}`);

  // 2) AI reads only those pages
  const subPdf = await extractPages(bytes, pages);
  const { finishes } = await extractFinishSchedule(subPdf.toString("base64"));
  console.log(`② AI extracted ${finishes.length} finishes:`);
  for (const f of finishes) {
    console.log(`     ${f.includedInFlooringScope ? "▸" : "·"} ${f.code.padEnd(8)} ${(f.type || "").padEnd(20)} ${f.unit.padEnd(3)} ${f.includedInFlooringScope ? "in-scope" : "out"}  (conf ${f.confidence})`);
  }

  // 3) project + document + pages (so it's fully navigable in the app)
  const project = await db.project.create({
    data: { companyId: company.id, name: "DC Youth Gym (dry run)", gc: "DGS", location: "Washington, DC", status: "draft", notes: "Dry-run; takeoff quantities are placeholder." },
  });
  const path = `${project.id}/dry-run.pdf`;
  await uploadPlan(path, bytes);
  const doc = await db.document.create({ data: { projectId: project.id, fileUrl: path } });
  await db.planSheet.createMany({
    data: scans.map((s) => ({
      documentId: doc.id, pageNumber: s.pageNumber, sheetNumber: s.sheetNumber, sheetTitle: s.sheetTitle,
      suggestedSheetType: s.suggestedSheetType,
      sheetType: pages.includes(s.pageNumber) ? "finish_schedule" : "untagged",
      scanScore: s.score, scanSignals: s.signals as object,
    })),
  });

  // 4) confirm finishes — seed rates from the library (exact code match), else needs_rate
  const lib = await db.finishLibraryItem.findMany({ where: { companyId: company.id }, include: { rate: true } });
  const libByCode = new Map(lib.map((l) => [l.code, l]));
  let seeded = 0;
  await db.projectFinish.createMany({
    data: finishes.map((f) => {
      const r = libByCode.get(f.code)?.rate;
      const base = { projectId: project.id, code: f.code, type: f.type, description: f.description ?? "", unit: f.unit, category: f.category, inScope: f.includedInFlooringScope };
      if (r) { seeded++; return { ...base, materialUnitCost: r.materialUnitCost, installRate: r.installRate, wastePct: r.wastePct, cartonSize: r.cartonSize, materialSource: r.materialSource, rateStatus: "seeded", libraryItemId: libByCode.get(f.code)!.id }; }
      return { ...base, rateStatus: "needs_rate" };
    }),
    skipDuplicates: true,
  });
  console.log(`③ Confirmed → ${seeded}/${finishes.length} auto-filled from library, ${finishes.length - seeded} need a rate`);

  // 5) PLACEHOLDER takeoff so the bid math flows (the human step)
  const inScope = await db.projectFinish.findMany({ where: { projectId: project.id, inScope: true } });
  await db.takeoffLine.createMany({
    data: inScope.map((f) => ({ projectId: project.id, sheet: "—", area: "Placeholder", finishCode: f.code, qty: f.unit === "LF" ? 600 : f.unit === "EA" ? 12 : 1500, unit: f.unit, status: "approved" })),
  });

  // 6) settings + bid
  await db.estimateSettings.create({ data: { projectId: project.id, profitPctMode: "margin", materialProfitPct: 0.25, installProfitPct: 0.3, taxPct: 0.08, taxMode: "total_sell_plus_freight", freight: 750 } });
  const full = await db.project.findUnique({ where: { id: project.id }, include: { finishes: true, takeoff: true, settings: true } });
  const bid = computeBid(full!.finishes, full!.takeoff, full!.settings);
  console.log(`④ Bid: price ${usd(bid.bidPrice)} · cost ${usd(bid.pricedScopeCost)} · profit ${usd(bid.profit)} (${pct(bid.blendedMargin)} margin)`);
  if (bid.warnings.length) console.log(`     warnings: ${bid.warnings.join(" · ")}`);

  // 7) sync to a v5 Sheet
  const auth = await getAuthedClient();
  if (auth) {
    const sheets = google.sheets({ version: "v4", auth });
    const input: BidInput = { name: full!.name, gc: full!.gc, location: full!.location, bidDate: full!.bidDate, notes: full!.notes, finishes: full!.finishes, takeoff: full!.takeoff, scopeItems: [], settings: full!.settings };
    const { spreadsheetId, url } = await createBidSpreadsheet(sheets, input);
    await db.project.update({ where: { id: project.id }, data: { sheetId: spreadsheetId } });
    console.log(`⑤ Synced → ${url}`);
  } else {
    console.log("⑤ (Google not connected — skipped sheet sync)");
  }
  console.log(`\n✓ Open the project in the app: /projects/${project.id}\n`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e?.response?.data?.error ?? e); process.exit(1); });
