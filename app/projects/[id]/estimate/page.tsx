import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { computeBid, usd, DEFAULT_SETTINGS } from "@/lib/estimate";
import { saveSettings } from "@/app/actions";
import { SyncSheetButton } from "@/components/sync-sheet-button";

export const dynamic = "force-dynamic";

const cell: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)" };
const field: React.CSSProperties = { font: "inherit", fontSize: 15, padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", width: "100%" };

export default async function EstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { finishes: true, takeoff: true, settings: true },
  });
  if (!project) notFound();

  const bid = computeBid(project.finishes, project.takeoff, project.settings);
  const s = project.settings ?? DEFAULT_SETTINGS;
  const saved = saveSettings.bind(null, id);

  return (
    <main className="wrap">
      <SiteHeader action={<Link href={`/projects/${id}`} className="btn">Back to bid</Link>} />
      <div className="page-head">
        <h1 className="page-title">Bid preview</h1>
      </div>
      <p className="detail-meta">{project.name}</p>

      {/* headline total */}
      <section className="section">
        <div className="card" style={{ alignItems: "baseline" }}>
          <div className="card-main">
            <div className="card-meta">Bid total</div>
            <div style={{ fontSize: 34, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              {usd(bid.bidTotal)}
            </div>
          </div>
        </div>
        {bid.warnings.length > 0 && (
          <ul className="hint" style={{ marginTop: 14 }}>
            {bid.warnings.map((w, i) => <li key={i} style={{ color: "#b45309" }}>⚠ {w}</li>)}
          </ul>
        )}
        <div style={{ marginTop: 16 }}>
          <SyncSheetButton projectId={id} sheetId={project.sheetId} />
        </div>
      </section>

      {/* line breakdown */}
      <section className="section">
        <h2 className="section-title">Lines</h2>
        <div className="card" style={{ padding: 0, display: "block", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ color: "var(--muted)", fontSize: 12, textAlign: "left" }}>
                <th style={cell}>Finish</th>
                <th style={cell}>Takeoff</th>
                <th style={cell}>Order qty</th>
                <th style={cell}>Material</th>
                <th style={cell}>Sub-install</th>
                <th style={cell}>Line total</th>
              </tr>
            </thead>
            <tbody>
              {bid.lines.map((l) => (
                <tr key={l.code}>
                  <td style={{ ...cell, fontWeight: 600 }}>{l.code}</td>
                  <td style={cell}>{l.takeoffQty.toLocaleString()}</td>
                  <td style={cell}>{l.orderQty.toLocaleString()}</td>
                  <td style={cell}>{usd(l.materialTotal)}</td>
                  <td style={cell}>{usd(l.installTotal)}{l.installMode === "pending" ? " (pending)" : ""}</td>
                  <td style={{ ...cell, fontWeight: 600 }}>{usd(l.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">
          Material {usd(bid.materialSubtotal)} + Sub-install {usd(bid.installSubtotal)} → after markup {usd(bid.afterMarkup)}
          {" "}+ freight {usd(bid.freight)} + tax {usd(bid.tax)} = <strong>{usd(bid.bidTotal)}</strong>
        </p>
      </section>

      {/* pricing settings */}
      <section className="section">
        <h2 className="section-title">Pricing</h2>
        <form action={saved} className="form" style={{ maxWidth: 640 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label>Pricing mode
              <select name="pricingMode" defaultValue={s.pricingMode} style={field}>
                <option value="markup">markup (on cost)</option>
                <option value="margin">margin (on price)</option>
              </select>
            </label>
            <label>Material % <input name="pct" type="number" step="0.01" defaultValue={s.pct} style={field} /></label>
            <label>Sub markup % <input name="subMarkupPct" type="number" step="0.01" defaultValue={s.subMarkupPct} style={field} /></label>
            <label>Tax % <input name="taxPct" type="number" step="0.01" defaultValue={s.taxPct ?? 0} style={field} /></label>
            <label>Tax base
              <select name="taxMode" defaultValue={s.taxMode} style={field}>
                <option value="material_cost_only">material cost only</option>
                <option value="material_sell_only">material sell only</option>
                <option value="total_sell_plus_freight">total + freight</option>
              </select>
            </label>
            <label>Freight $ <input name="freight" type="number" step="0.01" defaultValue={s.freight ?? 0} style={field} /></label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save pricing &amp; recompute</button>
          </div>
        </form>
        <p className="hint">
          Percentages as decimals (0.15 = 15%). This is the in-app preview — the Google Sheet stays the source of truth for the math.
        </p>
      </section>
    </main>
  );
}
