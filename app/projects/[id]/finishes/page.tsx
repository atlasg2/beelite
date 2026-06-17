import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { FinishReview } from "@/components/finish-review";
import { readSchedule } from "@/app/actions";
import type { ExtractedFinish } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export default async function FinishesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id }, include: { documents: true } });
  if (!project) notFound();

  const sheet = await db.planSheet.findFirst({
    where: { document: { projectId: id }, sheetType: "finish_schedule" },
    orderBy: { id: "desc" },
    include: { extraction: true },
  });
  const ext = sheet?.extraction;
  const finishes: ExtractedFinish[] = ext
    ? ((ext.corrected as any)?.finishes ?? (ext.rawOutput as any)?.finishes ?? [])
    : [];
  const firstDoc = project.documents[0];

  return (
    <main className="wrap">
      <SiteHeader action={<Link href={`/projects/${id}`} className="btn">Back to bid</Link>} />

      <div className="page-head">
        <h1 className="page-title">Finishes</h1>
      </div>
      <p className="detail-meta">{project.name}</p>

      <section className="section">
        {!ext ? (
          firstDoc ? (
            <div className="empty">
              <h2>Read the finish schedule</h2>
              <p>Claude will read your uploaded plan and pull out the finish codes for you to confirm.</p>
              <form action={readSchedule.bind(null, firstDoc.id)}>
                <button type="submit" className="btn btn-primary">Read finish schedule with AI</button>
              </form>
            </div>
          ) : (
            <div className="empty">
              <h2>No plan uploaded</h2>
              <p>Upload a plan on the bid page first, then come back to read its finishes.</p>
              <Link href={`/projects/${id}`} className="btn btn-primary">Go to bid</Link>
            </div>
          )
        ) : (
          <>
            <h2 className="section-title">Review the finishes Claude found ({finishes.length})</h2>
            <p className="detail-meta">
              Edit anything that’s off, then confirm. Flagged rows are low-confidence or out-of-scope.
              {ext.corrected ? " (Previously confirmed — re-confirm to update.)" : ""}
            </p>
            <FinishReview projectId={id} initial={finishes} />
          </>
        )}
      </section>
    </main>
  );
}
