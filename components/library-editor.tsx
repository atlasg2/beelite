"use client";

import { useState, useTransition } from "react";
import { saveLibrary } from "@/app/actions";

type Row = {
  code: string;
  type: string;
  description: string;
  unit: string;
  category: string;
  materialUnitCost: number;
  installRate: number;
  wastePct: number;
  cartonSize: number | null;
  materialSource: string;
};

const EMPTY: Row = {
  code: "", type: "", description: "", unit: "SF", category: "floor",
  materialUnitCost: 0, installRate: 0, wastePct: 0, cartonSize: null, materialSource: "elite_furnishes",
};

// Waste is stored as a decimal (0.08) but shown as a whole percent (8).
const pct = (w: number): number | "" => (w ? Math.round(w * 10000) / 100 : "");

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "9px 12px",
  borderBottom: "1px solid var(--border)",
  color: "var(--muted)",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = { padding: "8px 12px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" };
const inp: React.CSSProperties = {
  font: "inherit", fontSize: 14, padding: "6px 8px", border: "1px solid var(--border)",
  borderRadius: 8, background: "var(--surface)", color: "var(--text)", width: "100%",
};
const sel: React.CSSProperties = { ...inp, cursor: "pointer" };

export function LibraryEditor({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      setErr(null);
      const res = await saveLibrary(rows);
      if (res?.error) setErr(res.error);
    });
  const set = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const del = (i: number) => setRows((r) => r.filter((_, j) => j !== i));
  const add = () => setRows((r) => [...r, { ...EMPTY }]);

  return (
    <div>
      <div className="card" style={{ padding: 0, display: "block", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 920 }}>
          <colgroup>
            <col style={{ width: 92 }} />
            <col style={{ width: 130 }} />
            <col />
            <col style={{ width: 64 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 74 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={th}>Code</th>
              <th style={th}>Type</th>
              <th style={th}>Description</th>
              <th style={th}>Unit</th>
              <th style={th}>Category</th>
              <th style={{ ...th, textAlign: "right" }}>Material</th>
              <th style={{ ...th, textAlign: "right" }}>Install</th>
              <th style={{ ...th, textAlign: "right" }}>Waste</th>
              <th style={th}>Material source</th>
              <th style={th} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const owner = r.materialSource === "owner_furnishes";
              return (
                <tr key={i}>
                  <td style={td}>
                    <input style={{ ...inp, fontWeight: 700, fontFamily: "var(--font-mono), monospace" }}
                      value={r.code} placeholder="LVT-1" onChange={(e) => set(i, { code: e.target.value })} />
                  </td>
                  <td style={td}><input style={inp} value={r.type} placeholder="LVT" onChange={(e) => set(i, { type: e.target.value })} /></td>
                  <td style={td}><input style={inp} value={r.description} onChange={(e) => set(i, { description: e.target.value })} /></td>
                  <td style={td}>
                    <select style={sel} value={r.unit} onChange={(e) => set(i, { unit: e.target.value })}>
                      {["SF", "LF", "EA", "SY"].map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={td}>
                    <select style={sel} value={r.category} onChange={(e) => set(i, { category: e.target.value })}>
                      {["floor", "base", "transition", "stair", "wall", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <span className="cell-affix" data-disabled={owner}>
                      <span className="affix-sym">$</span>
                      <input type="number" step="0.01" min="0" disabled={owner}
                        value={owner ? "" : r.materialUnitCost || ""} placeholder={owner ? "—" : "0.00"}
                        onChange={(e) => set(i, { materialUnitCost: parseFloat(e.target.value) || 0 })} />
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <span className="cell-affix">
                      <span className="affix-sym">$</span>
                      <input type="number" step="0.01" min="0" value={r.installRate || ""} placeholder="0.00"
                        onChange={(e) => set(i, { installRate: parseFloat(e.target.value) || 0 })} />
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <span className="cell-affix">
                      <input type="number" step="1" min="0" style={{ width: 40 }}
                        value={pct(r.wastePct)} placeholder="0"
                        onChange={(e) => set(i, { wastePct: (parseFloat(e.target.value) || 0) / 100 })} />
                      <span className="affix-sym">%</span>
                    </span>
                  </td>
                  <td style={td}>
                    <select style={sel} value={r.materialSource} onChange={(e) => set(i, { materialSource: e.target.value })}>
                      <option value="elite_furnishes">Elite furnishes</option>
                      <option value="owner_furnishes">Owner / GC</option>
                    </select>
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <button type="button" onClick={() => del(i)} aria-label="Remove"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, lineHeight: 1 }}>×</button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td style={{ ...td, color: "var(--muted)" }} colSpan={10}>No standard rates yet — add your common finishes below.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {err && <p className="hint" style={{ color: "var(--gold)", marginTop: 12 }}>⚠ {err}</p>}
      <div className="form-actions" style={{ marginTop: 18, gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn" onClick={add}>+ Add finish</button>
        <button className="btn btn-primary" disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save standard rates"}
        </button>
        <span className="hint" style={{ margin: 0, padding: 0, border: 0 }}>
          Code must match what shows on plans (e.g. <strong>LVT-1</strong>) — that’s how new bids auto-fill.
          Install is your standard sub rate per unit.
        </span>
      </div>
    </div>
  );
}
