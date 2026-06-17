import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deriveWorkflow, type StageKey } from "@/lib/workflow";
import { usd } from "@/lib/estimate";

/**
 * Project workspace shell: a persistent left rail (the bid pipeline drawn as a measured rule, plus a
 * live bid readout) wrapping the active stage. Loads the project once and derives the workflow status
 * from the shared helper so the stepper and the bid never disagree.
 */
export async function ProjectWorkspace({
  projectId,
  active,
  children,
}: {
  projectId: string;
  active: StageKey;
  children: React.ReactNode;
}) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      documents: { include: { pages: true } },
      finishes: true,
      takeoff: true,
      scopeItems: true,
      settings: true,
    },
  });
  if (!project) notFound();

  const { stages, bid } = deriveWorkflow(project);

  return (
    <div className="ws">
      <aside className="ws-rail">
        <Link href="/" className="ws-back">← All bids</Link>
        <div>
          <div className="ws-proj-name">{project.name}</div>
          <div className="ws-proj-meta">
            {project.gc ?? "No GC"} · {project.location ?? "No location"}
          </div>
        </div>

        <nav className="rule" aria-label="Bid pipeline">
          {stages.map((s) => (
            <Link
              key={s.key}
              href={`/projects/${projectId}${s.path}`}
              className="rule-step"
              data-state={s.state}
              aria-current={s.key === active ? "page" : undefined}
            >
              <span className="rule-tick">{s.state === "done" ? "✓" : s.n}</span>
              <span>
                <span className="rule-label">{s.label}</span>
                <span className="rule-note">{s.note}</span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="ws-readout">
          <div className="ws-readout-label">Bid price</div>
          <div className="ws-readout-figure">{usd(bid.bidPrice)}</div>
          {bid.profit > 0 && <div className="ws-readout-sub">profit {usd(bid.profit)}</div>}
        </div>
      </aside>

      <main className="ws-main">{children}</main>
    </div>
  );
}
