import { db } from "@/lib/db";
import { downloadPlan } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Stream a plan's PDF to the browser (same-origin) so pdf.js can render pages client-side — far
// faster + crisper than server rasterization, which chokes on dense drawing pages.
const CACHE = new Map<string, Buffer>();

export async function GET(req: Request) {
  const documentId = new URL(req.url).searchParams.get("doc");
  if (!documentId) return new Response("bad request", { status: 400 });

  let bytes = CACHE.get(documentId);
  if (!bytes) {
    const doc = await db.document.findUnique({ where: { id: documentId } });
    if (!doc) return new Response("not found", { status: 404 });
    bytes = await downloadPlan(doc.fileUrl);
    if (CACHE.size > 4) CACHE.clear();
    CACHE.set(documentId, bytes);
  }
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "application/pdf", "Cache-Control": "private, max-age=86400" },
  });
}
