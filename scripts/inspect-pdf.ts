// Inspect a PDF: page count, is it vector (extractable text), and finish-schedule signal.
// Usage: npx tsx scripts/inspect-pdf.ts samples/midlands-A701.pdf
import { readFileSync } from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

async function main() {
  const path = process.argv[2];
  const data = new Uint8Array(readFileSync(path));
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  console.log("pages:", doc.numPages);

  let all = "";
  const perPage: { page: number; chars: number; finishHit: boolean }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map((it: any) => it.str).join(" ");
    all += " " + text;
    perPage.push({ page: i, chars: text.length, finishHit: /finish\s*(schedule|legend|material)/i.test(text) });
  }

  console.log("total extractable chars:", all.length, all.length > 500 ? "→ VECTOR (text layer)" : "→ likely SCANNED");
  console.log("pages with finish schedule/legend:", perPage.filter((p) => p.finishHit).map((p) => p.page));
  const codes = [...new Set((all.match(/\b(?:LVT|CPT|VCT|CT|RB|PT|WB|RES|EPX|PC|SC)-?\d?\b/gi) || []))];
  console.log("finish-like codes seen:", codes.slice(0, 40));
  console.log("snippet:", all.replace(/\s+/g, " ").slice(0, 400));
}
main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
