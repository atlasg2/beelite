/**
 * Scrape plan PDFs from the NOLA OneStop permit portal for triaged leads.
 *
 * For each permit (default: NolaPermit rows with leadStatus="saved"), resolve its portal link to the
 * permit's ref code, fetch the permit page, parse the inline document list, and download the
 * plan-shaped PDFs into data/nola/<permitNum>/ alongside a manifest.json listing EVERY document found
 * (kept or skipped) so nothing is silently lost. See docs/nola-portal-scraping.md for the full recipe.
 *
 *   npm run nola:docs
 *   tsx --env-file=.env scripts/nola-docs.ts --permit=25-19247-RNVS
 *   tsx --env-file=.env scripts/nola-docs.ts --status=saved --max=10 --keep=all --force
 *
 * Flags (all optional):
 *   --status   triage status to scrape           (default "saved"; use "new"/"dismissed"/"all")
 *   --permit   scrape one permit by PermitNum     (overrides --status)
 *   --keep     "plans" or "all"                    (default "plans" — drawings only, skip paperwork)
 *   --max      stop after this many permits        (default: all)
 *   --force    re-scrape even if manifest exists   (default: skip already-done permits)
 *
 * Idempotent: a permit whose folder already has manifest.json is skipped unless --force.
 */
process.loadEnvFile(".env");
import { mkdirSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const HOST = "https://onestopapp.nola.gov";
const ROOT = join(process.cwd(), "data", "nola");
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

// Keep drawing/plan PDFs; drop the paperwork (permits, receipts, contracts, approvals, etc.).
const KEEP = /\b(drawing|drawings|plan|plans|arch|architect|mep|floor|structural|elev|detail|schedule|cd)\b|a-?\d/i;
const DROP = /\b(receipt|building permit|contract|act of sale|articles|approval|license|authoriz|classification|fire marshal|insurance|invoice|affidavit|recorded|organization)\b/i;

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

/** OneStop link → ref code (== the SearchString token). */
function refFromLink(link: string | null): string | null {
  if (!link) return null;
  const m = /SearchString=([A-Za-z0-9]+)/i.exec(link);
  return m ? m[1] : null;
}

/** Safe filesystem name: strip path separators / odd chars, collapse whitespace. */
function safe(name: string): string {
  return (
    name
      .replace(/&amp;/g, "&")
      .replace(/[\/\\]+/g, "-")
      .replace(/[^a-zA-Z0-9 ._()&,-]+/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "file"
  );
}

type Doc = { docId: string; name: string; date: string | null; kept: boolean; bytes?: number; saved?: string };

/** Parse the permit page HTML → every document (filename, date, DocID) in its list. */
function parseDocs(html: string): Omit<Doc, "kept">[] {
  const out: Omit<Doc, "kept">[] = [];
  const re = /<li>\s*([\s\S]*?)\s*<a\b[^>]*onclick=['"]?DocRedirect\((\d+)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let text = m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    // trailing " (M/D/YYYY)" is the upload date, not part of the filename
    const dm = /\s*\((\d{1,2}\/\d{1,2}\/\d{4})\)\s*$/.exec(text);
    const date = dm ? dm[1] : null;
    if (dm) text = text.slice(0, dm.index).trim();
    out.push({ docId: m[2], name: text, date });
  }
  return out;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return res.text();
}

/** Download a document by DocID. Returns the buffer, or null if it isn't a PDF. */
async function fetchDoc(docId: string): Promise<Buffer | null> {
  const res = await fetch(`${HOST}/GetDocument.aspx?DocID=${docId}`, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  // Their Content-Type is the buggy "application/application/pdf"; trust the magic bytes instead.
  return buf.subarray(0, 5).toString("latin1") === "%PDF-" ? buf : null;
}

async function main() {
  const keepMode = arg("keep", "plans"); // plans | all
  const max = Number(arg("max", "0")) || Infinity;
  const force = hasFlag("force");
  const permitArg = arg("permit", "");
  const status = arg("status", "saved");

  const permits = permitArg
    ? await db.nolaPermit.findMany({ where: { permitNum: permitArg } })
    : await db.nolaPermit.findMany({
        where: status === "all" ? {} : { leadStatus: status },
        orderBy: { issueDate: { sort: "desc", nulls: "last" } },
      });

  console.log(
    `NOLA docs · ${permitArg ? `permit ${permitArg}` : `status="${status}"`} · keep=${keepMode}` +
      (max !== Infinity ? ` · max ${max}` : "") +
      ` · ${permits.length} candidate permit(s)`,
  );
  mkdirSync(ROOT, { recursive: true });

  let done = 0,
    skipped = 0,
    files = 0,
    bytes = 0;

  for (const p of permits) {
    if (done >= max) break;
    const ref = refFromLink(p.link);
    const dir = join(ROOT, safe(p.permitNum));
    if (existsSync(join(dir, "manifest.json")) && !force) {
      skipped++;
      continue;
    }
    if (!ref) {
      console.log(`  ⚠ ${p.permitNum}: no ref code in link — skipped`);
      skipped++;
      continue;
    }

    let docs: Omit<Doc, "kept">[] = [];
    try {
      const html = await fetchText(`${HOST}/PrmtView.aspx?ref=${ref}`);
      docs = parseDocs(html);
    } catch (e) {
      console.log(`  ⚠ ${p.permitNum}: ${(e as Error).message}`);
      skipped++;
      continue;
    }

    const classified: Doc[] = docs.map((d) => ({
      ...d,
      kept: keepMode === "all" ? true : KEEP.test(d.name) && !DROP.test(d.name),
    }));
    const toGet = classified.filter((d) => d.kept);

    mkdirSync(dir, { recursive: true });
    const used = new Set<string>();
    for (const d of toGet) {
      const buf = await fetchDoc(d.docId).catch(() => null);
      if (!buf) {
        console.log(`     · ${d.docId} ${d.name.slice(0, 50)} — not a PDF / failed`);
        continue;
      }
      let fname = safe(d.name);
      if (!/\.pdf$/i.test(fname)) fname += ".pdf";
      if (used.has(fname.toLowerCase())) fname = `${d.docId}_${fname}`; // dedupe by DocID
      used.add(fname.toLowerCase());
      writeFileSync(join(dir, fname), buf);
      d.bytes = buf.length;
      d.saved = fname;
      files++;
      bytes += buf.length;
    }

    const manifest = {
      permitNum: p.permitNum,
      ref,
      address: [p.originalAddress1, p.originalZip].filter(Boolean).join(", ") || null,
      permitType: p.permitType,
      description: p.description,
      portal: `${HOST}/PrmtView.aspx?ref=${ref}`,
      scrapedKeep: keepMode,
      docCount: classified.length,
      keptCount: toGet.length,
      documents: classified, // ALL docs, kept + skipped, with DocIDs so any can be pulled later
    };
    writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
    done++;
    const kept = classified.filter((d) => d.saved).length;
    console.log(
      `  [${done}] ${p.permitNum} · ${classified.length} docs, ${kept} plan PDF(s) saved · ${p.description?.slice(0, 48) ?? ""}`,
    );
  }

  const mb = (bytes / 1e6).toFixed(1);
  console.log(`Done. ${done} permit(s) scraped, ${skipped} skipped. ${files} PDF(s), ${mb} MB → ${ROOT}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
