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

const cell: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid var(--border)" };
const txt: React.CSSProperties = { font: "inherit", fontSize: 14, padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", width: 120 };
const num: React.CSSProperties = { ...txt, width: 76 };

export function LibraryEditor({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [pending, start] = useTransition();
  const set = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const del = (i: number) => setRows((r) => r.filter((_, j) => j !== i));
  const add = () => setRows((r) => [...r, { ...EMPTY }]);

  return (
    <div>
      <div className="card" style={{ padding: 0, display: "block", overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 980 }}>
          <thead>
            <tr style={{ color: "var(--muted)", fontSize: 12, textAlign: "left" }}>
              <th style={cell}>Code</th>
              <th style={cell}>Type</th>
              <th style={cell}>Description</th>
              <th style={cell}>Unit</th>
              <th style={cell}>Category</th>
              <th style={cell}>Material $/u</th>
              <th style={cell}>Install $/u</th>
              <th style={cell}>Waste %</th>
              <th style={cell}>Carton</th>
              <th style={cell}>Source</th>
              <th style={cell}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const owner = r.materialSource === "owner_furnishes";
              return (
                <tr key={i}>
                  <td style={cell}><input style={{ ...txt, width: 80, fontWeight: 600 }} value={r.code} placeholder="LVT-1" onChange={(e) => set(i, { code: e.target.value })} /></td>
                  <td style={cell}><input style={txt} value={r.type} placeholder="LVT" onChange={(e) => set(i, { type: e.target.value })} /></td>
                  <td style={cell}><input style={{ ...txt, width: 180 }} value={r.description} onChange={(e) => set(i, { description: e.target.value })} /></td>
                  <td style={cell}>
                    <select style={{ ...num, width: 64 }} value={r.unit} onChange={(e) => set(i, { unit: e.target.value })}>
                      {["SF", "LF", "EA", "SY"].map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={cell}>
                    <select style={{ ...num, width: 100 }} value={r.category} onChange={(e) => set(i, { category: e.target.value })}>
                      {["floor", "base", "transition", "wall", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={cell}><input style={{ ...num, opacity: owner ? 0.4 : 1 }} type="number" step="0.01" disabled={owner} value={owner ? "" : r.materialUnitCost} onChange={(e) => set(i, { materialUnitCost: parseFloat(e.target.value) || 0 })} /></td>
                  <td style={cell}><input style={num} type="number" step="0.01" value={r.installRate} onChange={(e) => set(i, { installRate: parseFloat(e.target.value) || 0 })} /></td>
                  <td style={cell}><input style={num} type="number" step="0.01" value={r.wastePct} onChange={(e) => set(i, { wastePct: parseFloat(e.target.value) || 0 })} /></td>
                  <td style={cell}><input style={{ ...num, width: 60 }} type="number" step="1" value={r.cartonSize ?? ""} onChange={(e) => set(i, { cartonSize: e.target.value === "" ? null : parseFloat(e.target.value) })} /></td>
                  <td style={cell}>
                    <select style={{ ...num, width: 130 }} value={r.materialSource} onChange={(e) => set(i, { materialSource: e.target.value })}>
                      <option value="elite_furnishes">Elite furnishes</option>
                      <option value="owner_furnishes">Owner/GC</option>
                    </select>
                  </td>
                  <td style={cell}><button className="btn" style={{ padding: "4px 10px" }} onClick={() => del(i)} aria-label="Remove">×</button></td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td style={{ ...cell, color: "var(--muted)" }} colSpan={11}>No standard rates yet — add your common finishes below.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="form-actions" style={{ marginTop: 18, gap: 10 }}>
        <button className="btn" onClick={add}>+ Add finish</button>
        <button className="btn btn-primary" disabled={pending} onClick={() => start(() => saveLibrary(rows))}>
          {pending ? "Saving…" : "Save standard rates"}
        </button>
        <span className="hint" style={{ margin: 0, padding: 0, border: 0 }}>
          Code must match what shows on plans (e.g. <strong>LVT-1</strong>) — that’s how bids auto-fill.
          Install $/u is your standard sub rate. Waste as a decimal (0.08 = 8%).
        </span>
      </div>
    </div>
  );
}
