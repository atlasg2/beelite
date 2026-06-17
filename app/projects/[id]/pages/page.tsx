import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { PagesTagger } from "@/components/pages-tagger";
import { rescanDocument } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function PagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { id } = await params;
  const { doc: docParam } = await searchParams;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      documents: { include: { pages: { orderBy: { pageNumber: "asc" } } }, orderBy: { id: "desc" } },
    },
  });
  if (!project) notFound();
  // explicit document if given (?doc=), else newest
  const doc = (docParam && project.documents.find((d) => d.id === docParam)) || project.documents[0];
  const suggested = doc?.pages.filter((p) => p.suggestedSheetType === "finish_schedule").map((p) => p.pageNumber) ?? [];

  return (
    <main className="wrap">
      <SiteHeader action={<Link href={`/projects/${id}`} className="btn">Back to bid</Link>} />
      <div className="page-head">
        <h1 className="page-title">Pages</h1>
      </div>
      <p className="detail-meta">
        {project.name}
        {doc ? ` · ${doc.pages.length} pages` : ""}
        {suggested.length ? ` · scan suggests the finish schedule on p${suggested.join(", p")}` : ""}
      </p>

      <section className="section">
        {!doc ? (
          <div className="empty">
            <h2>No plan uploaded</h2>
            <p>Upload a plan on the bid page first.</p>
            <Link href={`/projects/${id}`} className="btn btn-primary">Go to bid</Link>
          </div>
        ) : doc.pages.length === 0 ? (
          <div className="empty">
            <h2>Not scanned yet</h2>
            <p>The page scan hasn’t run for this plan (or it failed). Scan it now.</p>
            <form action={rescanDocument.bind(null, doc.id)}>
              <button type="submit" className="btn btn-primary">Scan pages</button>
            </form>
          </div>
        ) : (
          <>
            <PagesTagger
              projectId={id}
              documentId={doc.id}
              initial={doc.pages.map((p) => ({
                id: p.id,
                pageNumber: p.pageNumber,
                sheetNumber: p.sheetNumber,
                sheetTitle: p.sheetTitle,
                suggestedSheetType: p.suggestedSheetType,
                scanScore: p.scanScore,
                sheetType: p.sheetType,
              }))}
            />
            <form action={rescanDocument.bind(null, doc.id)} className="hint" style={{ marginTop: 18 }}>
              <button type="submit" className="btn" style={{ fontSize: 13, padding: "8px 12px" }}>
                Re-scan pages (resets tags)
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
