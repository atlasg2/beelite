import { SiteHeader } from "@/components/site-header";

// The finishes the AI pulled from this exact sheet (one structured call, ~$0.06).
const FINISHES = [
  { code: "CPT-1", type: "Carpet Tile", unit: "SF", category: "floor", inScope: true, conf: 0.97 },
  { code: "CPT-2", type: "Carpet Tile", unit: "SF", category: "floor", inScope: true, conf: 0.97 },
  { code: "CPT-3", type: "Walk-Off Carpet Tile", unit: "SF", category: "floor", inScope: true, conf: 0.96 },
  { code: "LVT-1", type: "Luxury Vinyl Tile", unit: "SF", category: "floor", inScope: true, conf: 0.97 },
  { code: "LVT-2", type: "Luxury Vinyl Tile", unit: "SF", category: "floor", inScope: true, conf: 0.96 },
  { code: "RB-1", type: "Rubber Base", unit: "LF", category: "base", inScope: true, conf: 0.95 },
  { code: "ST-1", type: "Stair Nosing", unit: "LF", category: "transition", inScope: true, conf: 0.93 },
  { code: "ST-2", type: "Stair Nosing", unit: "LF", category: "transition", inScope: true, conf: 0.93 },
  { code: "ST-3", type: "Stair Nosing", unit: "other", category: "transition", inScope: false, conf: 0.9 },
];

const cell: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid var(--border)", textAlign: "left" };

export default function SamplePage() {
  return (
    <main className="wrap">
      <SiteHeader />

      <div className="page-head">
        <h1 className="page-title">Sample plan — Midlands A-701</h1>
      </div>
      <p className="detail-meta">
        Finish Floor Plans &amp; Finish Materials · 1 page · the “Finish Materials” box (middle-right)
        is the schedule the AI read.
      </p>

      <a className="btn" href="/samples/midlands-A701.png" target="_blank" rel="noreferrer">
        Open full size ↗
      </a>

      <section className="section">
        <a href="/samples/midlands-A701.png" target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/samples/midlands-A701.png"
            alt="Midlands Technical College — Sheet A-701"
            style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 12, display: "block", background: "#fff" }}
          />
        </a>
      </section>

      <section className="section">
        <h2 className="section-title">What the AI extracted — {FINISHES.length} finishes (~$0.06)</h2>
        <div className="card" style={{ padding: 0, display: "block", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr style={{ color: "var(--muted)", fontSize: 13 }}>
                <th style={cell}>Code</th>
                <th style={cell}>Type</th>
                <th style={cell}>Unit</th>
                <th style={cell}>Category</th>
                <th style={cell}>In scope</th>
                <th style={cell}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {FINISHES.map((f) => (
                <tr key={f.code}>
                  <td style={{ ...cell, fontWeight: 600 }}>{f.code}</td>
                  <td style={cell}>{f.type}</td>
                  <td style={cell}>{f.unit}</td>
                  <td style={cell}>{f.category}</td>
                  <td style={cell}>{f.inScope ? "✓" : "—"}</td>
                  <td style={cell}>{f.conf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">
          Compare against the “Finish Materials” box on the sheet above. Note ST-3 flagged out-of-scope —
          the kind of call an estimator confirms (and that correction becomes training data).
        </p>
      </section>
    </main>
  );
}
