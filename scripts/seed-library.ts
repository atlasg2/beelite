/**
 * Seed the default company's standard-rates library with common commercial flooring finishes.
 * Rates are realistic DEMO GUESSES (material $/unit to the contractor, install = standard sub $/unit) —
 * replace with the real company's numbers once you have them. Idempotent (upsert by code).
 *
 * Run: tsx --env-file=.env scripts/seed-library.ts
 */
import { db } from "@/lib/db";
import { getOrCreateDefaultCompany } from "@/lib/company";

type Seed = {
  code: string; type: string; description: string; unit: string; category: string;
  materialUnitCost: number; installRate: number; wastePct: number; cartonSize: number | null;
};

const SEEDS: Seed[] = [
  { code: "LVT-1", type: "Luxury vinyl plank", description: "LVP, glue-down", unit: "SF", category: "floor", materialUnitCost: 2.85, installRate: 1.55, wastePct: 0.08, cartonSize: 30 },
  { code: "LVT-2", type: "Luxury vinyl tile", description: "LVT, premium", unit: "SF", category: "floor", materialUnitCost: 3.40, installRate: 1.65, wastePct: 0.08, cartonSize: 30 },
  { code: "CPT-1", type: "Carpet tile", description: "Modular carpet tile", unit: "SF", category: "floor", materialUnitCost: 3.20, installRate: 0.95, wastePct: 0.06, cartonSize: 48 },
  { code: "CPT-2", type: "Carpet tile", description: "Carpet tile, premium", unit: "SF", category: "floor", materialUnitCost: 3.85, installRate: 1.05, wastePct: 0.06, cartonSize: 48 },
  { code: "VCT-1", type: "Vinyl composition tile", description: "VCT 12x12", unit: "SF", category: "floor", materialUnitCost: 1.05, installRate: 1.10, wastePct: 0.10, cartonSize: 45 },
  { code: "SV-1", type: "Sheet vinyl", description: "Sheet vinyl, heat-welded", unit: "SF", category: "floor", materialUnitCost: 2.40, installRate: 2.60, wastePct: 0.10, cartonSize: null },
  { code: "EPX-1", type: "Epoxy floor", description: "Resinous epoxy system", unit: "SF", category: "floor", materialUnitCost: 2.10, installRate: 3.40, wastePct: 0.05, cartonSize: null },
  { code: "PC-1", type: "Polished concrete", description: "Polished / sealed concrete", unit: "SF", category: "floor", materialUnitCost: 0.40, installRate: 2.75, wastePct: 0.02, cartonSize: null },
  { code: "PT-1", type: "Porcelain tile", description: "Porcelain floor tile", unit: "SF", category: "floor", materialUnitCost: 4.50, installRate: 6.25, wastePct: 0.10, cartonSize: null },
  { code: "RB-1", type: "Rubber base", description: '4" rubber wall base', unit: "LF", category: "base", materialUnitCost: 0.92, installRate: 1.10, wastePct: 0.05, cartonSize: 100 },
  { code: "RB-2", type: "Rubber base", description: '6" rubber wall base', unit: "LF", category: "base", materialUnitCost: 1.25, installRate: 1.20, wastePct: 0.05, cartonSize: 100 },
  { code: "TR-1", type: "Transition strip", description: "Transition / reducer strip", unit: "EA", category: "transition", materialUnitCost: 14.00, installRate: 9.00, wastePct: 0, cartonSize: null },
];

async function main() {
  const company = await getOrCreateDefaultCompany();
  for (const s of SEEDS) {
    const item = await db.finishLibraryItem.upsert({
      where: { companyId_code: { companyId: company.id, code: s.code } },
      create: { companyId: company.id, code: s.code, type: s.type, description: s.description, unit: s.unit, category: s.category },
      update: { type: s.type, description: s.description, unit: s.unit, category: s.category },
    });
    await db.rateCatalogEntry.upsert({
      where: { finishId: item.id },
      create: { companyId: company.id, finishId: item.id, materialUnitCost: s.materialUnitCost, installRate: s.installRate, wastePct: s.wastePct, cartonSize: s.cartonSize, materialSource: "elite_furnishes" },
      update: { materialUnitCost: s.materialUnitCost, installRate: s.installRate, wastePct: s.wastePct, cartonSize: s.cartonSize, materialSource: "elite_furnishes" },
    });
  }
  const count = await db.finishLibraryItem.count({ where: { companyId: company.id } });
  console.log(`Seeded ${SEEDS.length} standard finishes. Library now has ${count} total.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
