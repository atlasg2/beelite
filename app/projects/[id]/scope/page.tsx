import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectWorkspace } from "@/components/project-workspace";
import { ScopeEditor } from "@/components/scope-editor";

export const dynamic = "force-dynamic";

export default async function ScopePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { scopeItems: { orderBy: { label: "asc" } } },
  });
  if (!project) notFound();

  return (
    <ProjectWorkspace projectId={id} active="scope">
      <div className="page-head">
        <h1 className="page-title">Scope &amp; exclusions</h1>
      </div>
      <p className="detail-meta">What’s in your number, and what isn’t — these become the proposal’s assumptions.</p>

      <section className="section">
        <ScopeEditor
          projectId={id}
          initial={project.scopeItems.map((s) => ({ label: s.label, mode: s.mode, allowance: s.allowance }))}
        />
      </section>
    </ProjectWorkspace>
  );
}
