import Link from "next/link";
import { db } from "@/lib/db";
import { DashSidebar } from "@/components/dash-sidebar";
import { DeleteBidButton } from "@/components/delete-bid-button";
import { deriveBidStatus, type BidStatus } from "@/lib/bid-status";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null) {
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  // Reference plan sets (status="corpus") are not bids — they live in the Plan library, not here.
  const projects = await db.project.findMany({
    where: { status: { not: "corpus" } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { documents: true, finishes: true } },
      finishes: { select: { code: true }, take: 8 },
    },
  });

  type Row = (typeof projects)[number] & { bidStatus: BidStatus; chips: string[] };
  const all: Row[] = projects.map((p) => ({
    ...p,
    bidStatus: deriveBidStatus({
      status: p.status,
      documentsCount: p._count.documents,
      finishesCount: p._count.finishes,
      sheetId: p.sheetId,
    }),
    chips: [...new Set(p.finishes.map((f) => f.code).filter(Boolean))].slice(0, 4),
  }));

  const rows = all
    .filter((r) => !query || [r.name, r.gc, r.location].some((v) => v?.toLowerCase().includes(query)))
    .sort((a, b) => (a.bidStatus.key === "passed" ? 1 : 0) - (b.bidStatus.key === "passed" ? 1 : 0));

  return (
    <div className="dash">
      <DashSidebar active="bids" />

      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1>Bids</h1>
            <p className="dash-sub">Every bid, from plan upload to submission.</p>
          </div>
          <div className="dash-tools">
            <form>
              <input className="dash-search" type="search" name="q" defaultValue={q ?? ""} placeholder="Search bids…" />
            </form>
            <Link href="/projects/new" className="btn btn-primary">New bid</Link>
          </div>
        </div>

        {all.length === 0 ? (
          <div className="empty">
            <h2>No bids yet</h2>
            <p>Upload a plan and the rest follows — Claude reads it, you confirm, you bid.</p>
            <Link href="/projects/new" className="btn btn-primary">Create your first bid</Link>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Bid</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Scope</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="dash-row" data-passed={r.bidStatus.key === "passed"}>
                    <td><Link href={`/projects/${r.id}`} className="dash-bid-name">{r.name}</Link></td>
                    <td style={{ color: "var(--muted)" }}>{r.location ?? "—"}</td>
                    <td><span className="dash-badge" data-tone={r.bidStatus.key}>{r.bidStatus.label}</span></td>
                    <td>
                      {r.chips.length ? (
                        <div className="dash-chips">{r.chips.map((c) => <span key={c} className="dash-chip">{c}</span>)}</div>
                      ) : (
                        <span className="dash-chip-empty">—</span>
                      )}
                    </td>
                    <td className="dash-mono">{fmtDate(r.createdAt)}</td>
                    <td><DeleteBidButton id={r.id} name={r.name} /></td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>
                      No bids match “{q}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
