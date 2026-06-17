import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { signedUrl } from "@/lib/storage";
import { uploadDocument } from "@/app/actions";
import { ProjectWorkspace } from "@/components/project-workspace";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { documents: { include: { pages: true }, orderBy: { id: "desc" } } },
  });
  if (!project) notFound();

  const upload = uploadDocument.bind(null, project.id);
  const docs = await Promise.all(
    project.documents.map(async (d) => ({
      ...d,
      url: await signedUrl(d.fileUrl).catch(() => null),
      filename: d.fileUrl.split("/").pop() ?? d.fileUrl,
    }))
  );

  return (
    <ProjectWorkspace projectId={id} active="plans">
      <div className="page-head">
        <h1 className="page-title">Plans</h1>
        {docs.length > 0 && <span className="page-count">{docs.length} uploaded</span>}
      </div>
      <p className="detail-meta">
        Upload the architectural set, then open it to tag the finish-schedule pages so Claude can read them.
      </p>

      {docs.length > 0 && (
        <div className="list" style={{ margin: "20px 0" }}>
          {docs.map((d) => {
            const suggested = d.pages.filter((p) => p.suggestedSheetType === "finish_schedule").length;
            const confirmed = d.pages.filter((p) => p.sheetType === "finish_schedule").length;
            return (
              <div key={d.id} className="card">
                <div className="card-main">
                  <div className="card-title">{d.filename}</div>
                  <div className="card-meta">
                    {d.pages.length ? `${d.pages.length} pages` : "scanning…"}
                    {confirmed > 0
                      ? ` · ${confirmed} tagged finish schedule`
                      : suggested > 0
                        ? ` · ${suggested} look like finish schedules`
                        : ""}
                  </div>
                </div>
                <Link className="btn" href={`/projects/${id}/pages?doc=${d.id}`}>Open pages</Link>
                {d.url && (
                  <a className="btn" href={d.url} target="_blank" rel="noreferrer">PDF</a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form action={upload} className="form" style={{ marginTop: 8 }}>
        <div className="field">
          <label htmlFor="file">Upload a plan (PDF)</label>
          <input id="file" name="file" type="file" accept="application/pdf" required />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Upload plan</button>
        </div>
      </form>
    </ProjectWorkspace>
  );
}
