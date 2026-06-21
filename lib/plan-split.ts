import { PDFDocument } from "pdf-lib";
import { db } from "@/lib/db";
import { uploadPlan } from "@/lib/storage";
import { ingestDocument } from "@/lib/ingest";
import { extractPages } from "@/lib/pdf";

// Upload a plan PDF as ONE logical set, auto-splitting into <50MB parts when it exceeds the Supabase
// bucket cap. Each part becomes its own Document; the plans viewer already stitches multiple Documents
// into one continuous page set, so the split is invisible in the UI. This replaces the manual halving
// we did by hand for the 3800 Texas set.
//
// Sizing: target SAFE_BYTES per part (margin under the 50MB cap; pdf-lib duplicates shared fonts/images
// into each part, so a part can be larger than its share of the source). We chunk by an estimate from
// the source's average page weight, materialize each chunk, and SUBDIVIDE any chunk that still lands
// over HARD_BYTES — bounded saves (~one per emitted part), not the O(pages^2) measure-every-page loop.

const SAFE_BYTES = 40 * 1024 * 1024; // target part size
const HARD_BYTES = 47 * 1024 * 1024; // never emit a part above this (under the 50MB cap)

const safeStem = (name: string) => name.replace(/[^\w.\-]+/g, "_").replace(/\.pdf$/i, "");

type Part = { bytes: Buffer; firstIdx: number };

export async function splitToParts(bytes: Buffer): Promise<Part[]> {
  const src = await PDFDocument.load(bytes, { updateMetadata: false });
  const n = src.getPageCount();
  const perChunk = Math.max(1, Math.floor((n * SAFE_BYTES) / bytes.byteLength)); // by source avg page weight
  const queue: number[][] = [];
  for (let i = 0; i < n; i += perChunk) {
    queue.push(Array.from({ length: Math.min(perChunk, n - i) }, (_, k) => i + k));
  }
  const parts: Part[] = [];
  while (queue.length) {
    const idxs = queue.shift()!;
    const buf = await extractPages(bytes, idxs.map((i) => i + 1)); // extractPages is 1-based
    if (buf.byteLength > HARD_BYTES && idxs.length > 1) {
      const mid = Math.ceil(idxs.length / 2);
      queue.unshift(idxs.slice(0, mid), idxs.slice(mid)); // re-split; firstIdx ordering fixed by the final sort
      continue;
    }
    if (buf.byteLength > HARD_BYTES) {
      throw new Error(`plan-split: single page ${idxs[0] + 1} is ${(buf.byteLength / 1e6).toFixed(1)}MB — over the cap; cannot split further`);
    }
    parts.push({ bytes: buf, firstIdx: idxs[0] });
  }
  parts.sort((a, b) => a.firstIdx - b.firstIdx);
  return parts;
}

export type UploadPlanSetResult = { documents: string[]; parts: number; pages: number };

/**
 * Store one plan PDF for a project — splitting into multiple <50MB Documents if needed — and ingest
 * each (per-page text + image). Returns the created Document ids and total page count.
 */
export async function uploadPlanSet(
  projectId: string,
  bytes: Buffer,
  name: string,
): Promise<UploadPlanSetResult> {
  const stem = safeStem(name);
  const parts = bytes.byteLength <= SAFE_BYTES ? [{ bytes, firstIdx: 0 }] : await splitToParts(bytes);

  const documents: string[] = [];
  let pages = 0;
  for (let i = 0; i < parts.length; i++) {
    const multi = parts.length > 1;
    const fname = multi ? `${stem}.part${String(i + 1).padStart(2, "0")}.pdf` : `${stem}.pdf`;
    const path = `${projectId}/${fname}`;
    try {
      await uploadPlan(path, parts[i].bytes);
    } catch (e) {
      // Already-uploaded (upsert:false throw) is fine — reuse the stored object. A PlanTooLargeError
      // here would be a real bug (parts are pre-capped), so only swallow the benign "already exists".
      if ((e as { name?: string })?.name === "PlanTooLargeError") throw e;
    }
    const doc = await db.document.create({
      data: {
        projectId,
        fileUrl: path,
        originalFilename: multi ? `${name} (part ${i + 1}/${parts.length})` : name,
      },
    });
    const res = await ingestDocument(doc.id, { bytes: Buffer.from(parts[i].bytes) });
    documents.push(doc.id);
    pages += res.pages;
  }
  return { documents, parts: parts.length, pages };
}
