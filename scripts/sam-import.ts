/**
 * Import the local SAM.gov corpus (data/sam/) into the database as ready-to-review bids.
 *
 * For each opportunity folder: one Project (with SAM provenance in notes), and for each plan/spec
 * PDF one Document (bytes → Supabase "plans" bucket) plus a PlanSheet per page tagged by the
 * finish-schedule scanner. Mirrors the upload path in app/actions.ts:uploadDocument.
 *
 *   tsx --env-file=.env scripts/sam-import.ts
 *
 * Idempotent: a Project is reused by name; a PDF already stored for it is skipped. Run sam-fetch
 * first to populate data/sam/. Reports, per project, how many pages the scanner flags as finish
 * schedules — the high-signal plans to practice on.
 */
process.loadEnvFile(".env");
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { scanPdf } from "../lib/pdf";

const db = new PrismaClient();
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const ROOT = join(process.cwd(), "data", "sam");

type Manifest = {
  soln?: string;
  noticeId?: string;
  title?: string;
  view?: string;
  agency?: string | null;
  location?: string | null;
  files?: { name: string; bytes: number }[];
};

function storageKey(name: string): string {
  // Supabase keys: avoid spaces / odd chars so signed URLs and the AI fetch stay clean.
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

async function main() {
  if (!existsSync(ROOT)) throw new Error(`No corpus at ${ROOT}. Run scripts/sam-fetch.ts first.`);
  const dirs = readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  if (!dirs.length) { console.log("Corpus is empty — nothing to import."); return; }

  const company = (await db.company.findFirst()) ?? (await db.company.create({ data: { name: "My Company" } }));
  let newProjects = 0, newDocs = 0, skippedDocs = 0;
  const report: { name: string; pages: number; flagged: { page: number; score: number }[] }[] = [];

  for (const soln of dirs) {
    const dir = join(ROOT, soln);
    const mPath = join(dir, "manifest.json");
    const m: Manifest = existsSync(mPath) ? JSON.parse(readFileSync(mPath, "utf8")) : {};
    const pdfs = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) continue;

    const name = `SAM ${soln}${m.title ? ` — ${m.title}` : ""}`.slice(0, 200);
    let project = await db.project.findFirst({ where: { name }, include: { documents: true } });
    if (!project) {
      const notes = [
        m.noticeId ? `SAM noticeId: ${m.noticeId}` : null,
        m.view ? `View: ${m.view}` : null,
      ].filter(Boolean).join("\n") || null;
      project = await db.project.create({
        data: { companyId: company.id, name, gc: m.agency ?? null, location: m.location ?? null, notes },
        include: { documents: true },
      });
      newProjects++;
    }

    const flagged: { page: number; score: number }[] = [];
    let pages = 0;
    for (const pdf of pdfs) {
      const key = `${project.id}/sam/${storageKey(pdf)}`;
      if (project.documents.some((d) => d.fileUrl === key)) { skippedDocs++; continue; }
      const bytes = readFileSync(join(dir, pdf));
      const up = await sb.storage.from("plans").upload(key, bytes, { contentType: "application/pdf", upsert: true });
      if (up.error) { console.log("  upload error:", pdf, up.error.message); continue; }
      const doc = await db.document.create({ data: { projectId: project.id, fileUrl: key } });
      newDocs++;

      try {
        const scans = await scanPdf(bytes);
        if (scans.length) {
          await db.planSheet.createMany({
            data: scans.map((s) => ({
              documentId: doc.id, pageNumber: s.pageNumber, sheetNumber: s.sheetNumber,
              sheetTitle: s.sheetTitle, suggestedSheetType: s.suggestedSheetType,
              scanScore: s.score, scanSignals: s.signals as object,
            })),
          });
        }
        pages += scans.length;
        for (const s of scans) if (s.suggestedSheetType === "finish_schedule") flagged.push({ page: s.pageNumber, score: Number(s.score.toFixed(2)) });
      } catch (e) {
        console.log("  scan failed:", pdf, (e as Error).message);
      }
    }
    if (pages || flagged.length) report.push({ name, pages, flagged });
  }

  console.log(`\nImported: ${newProjects} new project(s), ${newDocs} new document(s), ${skippedDocs} already-present.`);
  const withSchedule = report.filter((r) => r.flagged.length).sort((a, b) => b.flagged.length - a.flagged.length);
  console.log(`\nFinish-schedule candidates (${withSchedule.length} project(s) — best practice material):`);
  for (const r of withSchedule) {
    console.log(`  • ${r.name.slice(0, 80)} — pp ${r.flagged.map((f) => `${f.page}(${f.score})`).join(", ")}`);
  }
  console.log(`\nTotal projects in DB: ${await db.project.count()}`);
  await db.$disconnect();
}

main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
