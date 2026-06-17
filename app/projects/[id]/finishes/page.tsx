import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectWorkspace } from "@/components/project-workspace";
import { FinishReview } from "@/components/finish-review";
import { readSchedule } from "@/app/actions";
import type { ExtractedFinish } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export default async function FinishesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id }, include: { documents: true } });
  if (!project) notFound();

  const sheet = await db.planSheet.findFirst({
    where: { document: { projectId: id }, extraction: { isNot: null } },
    orderBy: { pageNumber: "asc" },
    include: { extraction: true },
  });
  const ext = sheet?.extraction;
  const finishes: ExtractedFinish[] = ext
    ? ((ext.corrected as any)?.finishes ?? (ext.rawOutput as any)?.finishes ?? [])
    : [];
  // the document that actually has tagged finish-schedule pages (not just documents[0])
  const taggedDoc = await db.document.findFirst({
    where: { projectId: id, pages: { some: { sheetType: "finish_schedule" } } },
    orderBy: { id: "desc" },
  });
  const firstDoc = project.documents[0];
  const taggedCount = await db.planSheet.count({
    where: { document: { projectId: id }, sheetType: "finish_schedule" },
  });

  return (
    <ProjectWorkspace projectId={id} active="finishes">
      <div className="page-head">
        <h1 className="page-title">Finishes</h1>
      </div>
      <p className="detail-meta">{project.name}</p>

      <section className="section">
        {!ext ? (
          !firstDoc ? (
            <div className="empty">
              <h2>No plan uploaded</h2>
              <p>Upload a plan on the bid page first, then come back to read its finishes.</p>
              <Link href={`/projects/${id}`} className="btn btn-primary">Go to bid</Link>
            </div>
          ) : taggedDoc ? (
            <div className="empty">
              <h2>Read the finish schedule</h2>
              <p>{taggedCount} page{taggedCount === 1 ? "" : "s"} tagged. Claude will read just those and pull out the finishes.</p>
              <form action={readSchedule.bind(null, taggedDoc.id)}>
                <button type="submit" className="btn btn-primary">Read finishes from {taggedCount} page{taggedCount === 1 ? "" : "s"}</button>
              </form>
            </div>
          ) : (
            <div className="empty">
              <h2>Tag the finish-schedule page first</h2>
              <p>On a real plan set, the finish schedule is one of many pages. Open Pages, confirm which page(s) hold the finish schedule, then read.</p>
              <Link href={`/projects/${id}/pages`} className="btn btn-primary">Open Pages</Link>
            </div>
          )
        ) : (
          <>
            <h2 className="section-title">Review the finishes Claude found ({finishes.length})</h2>
            <p className="detail-meta">
              Edit anything that’s off, then confirm. Flagged rows are low-confidence or out-of-scope.
              {ext.corrected ? " (Previously confirmed — re-confirm to update.)" : ""}
            </p>
            <FinishReview projectId={id} planSheetId={sheet!.id} initial={finishes} />
          </>
        )}
      </section>
    </ProjectWorkspace>
  );
}
