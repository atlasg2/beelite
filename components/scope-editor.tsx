"use client";

import { useState, useTransition } from "react";
import { replaceScope } from "@/app/actions";

type Row = { label: string; mode: string; allowance: number | null };

const cell: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)" };
const inp: React.CSSProperties = { font: "inherit", fontSize: 14, padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", width: "100%" };

// Common flooring inclusions/exclusions to start from — one click each.
const SUGGESTIONS: Row[] = [
  { label: "Floor prep / patching", mode: "included", allowance: null },
  { label: "Moisture mitigation", mode: "excluded", allowance: null },
  { label: "Demolition / removal of existing floor", mode: "excluded", allowance: null },
  { label: "Subfloor leveling beyond 1/4\"", mode: "excluded", allowance: null },
  { label: "Asbestos / hazmat abatement", mode: "excluded", allowance: null },
  { label: "After-hours / weekend labor", mode: "excluded", allowance: null },
];

export function ScopeEditor({ projectId, initial }: { projectId: string; initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [pending, start] = useTransition();
  const set = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const del = (i: number) => setRows((r) => r.filter((_, j) => j !== i));
  const add = (row?: Row) => setRows((r) => [...r, row ?? { label: "", mode: "included", allowance: null }]);
  const have = new Set(rows.map((r) => r.label.toLowerCase()));

  return (
    <div>
      <div className="card" style={{ padding: 0, display: "block", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 560 }}>
          <thead>
            <tr style={{ color: "var(--muted)", fontSize: 12, textAlign: "left" }}>
              <th style={cell}>Item</th>
              <th style={{ ...cell, width: 150 }}>Included / excluded</th>
              <th style={{ ...cell, width: 140 }}>Allowance $</th>
              <th style={{ ...cell, width: 44 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={cell}>
                  <input style={inp} value={r.label} placeholder="e.g. Moisture mitigation"
                    onChange={(e) => set(i, { label: e.target.value })} />
                </td>
                <td style={cell}>
                  <select style={inp} value={r.mode} onChange={(e) => set(i, { mode: e.target.value })}>
                    <option value="included">included</option>
                    <option value="excluded">excluded</option>
                    <option value="pending">pending</option>
                  </select>
                </td>
                <td style={cell}>
                  <input style={{ ...inp, opacity: r.mode === "included" ? 1 : 0.4 }} type="number" step="1" min="0"
                    disabled={r.mode !== "included"} value={r.allowance ?? ""}
                    onChange={(e) => set(i, { allowance: e.target.value === "" ? null : parseFloat(e.target.value) })} />
                </td>
                <td style={cell}>
                  <button className="btn" style={{ padding: "4px 10px" }} onClick={() => del(i)} aria-label="Remove">×</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td style={{ ...cell, color: "var(--muted)" }} colSpan={4}>No scope items — add your inclusions and exclusions below.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {SUGGESTIONS.filter((s) => !have.has(s.label.toLowerCase())).map((s) => (
          <button key={s.label} className="btn" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => add(s)}>
            + {s.label} <span style={{ color: "var(--muted)" }}>({s.mode})</span>
          </button>
        ))}
      </div>

      <div className="form-actions" style={{ marginTop: 18, gap: 10 }}>
        <button className="btn" onClick={() => add()}>+ Blank row</button>
        <button className="btn btn-primary" disabled={pending} onClick={() => start(() => replaceScope(projectId, rows))}>
          {pending ? "Saving…" : "Save scope"}
        </button>
        <span className="hint" style={{ margin: 0, padding: 0, border: 0 }}>
          These become the “Assumptions” on the bid sheet — what’s in your number and what isn’t.
        </span>
      </div>
    </div>
  );
}
