import { db } from "@/lib/db";
import { downloadPlan } from "@/lib/storage";
import { renderPage } from "@/lib/pdf";

export const dynamic = "force-dynamic";

// GET /api/preview?doc=<documentId>&page=<n> → PNG of that page
export async function GET(req: Request) {
  const url = new URL(req.url);
  const documentId = url.searchParams.get("doc");
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  if (!documentId || !Number.isFinite(page)) return new Response("bad request", { status: 400 });

  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) return new Response("not found", { status: 404 });

  try {
    const bytes = await downloadPlan(doc.fileUrl);
    const png = await renderPage(bytes, page, 1.6);
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=600" },
    });
  } catch (e) {
    console.error("preview render failed:", e);
    return new Response("render failed", { status: 500 });
  }
}
