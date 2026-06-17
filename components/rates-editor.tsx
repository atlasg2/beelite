"use client";

import { useState, useTransition } from "react";
import { saveRates } from "@/app/actions";

type Row = {
  id: string;
  code: string;
  type: string;
  materialCost: number;
  installMode: string;
  installAmount: number | null;
  wastePct: number;
  cartonSize: number | null;
  furnishType: string;
};

const cell: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)" };
const num: React.CSSProperties = { font: "inherit", fontSize: 14, padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", width: 90 };

export function RatesEditor({ projectId, initial }: { projectId: string; initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [pending, start] = useTransition();
  const set = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div>
      <div className="card" style={{ padding: 0, display: "block", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 720 }}>
          <thead>
            <tr style={{ color: "var(--muted)", fontSize: 12, textAlign: "left" }}>
              <th style={cell}>Finish</th>
              <th style={cell}>Material $/u</th>
              <th style={cell}>Waste %</th>
              <th style={cell}>Carton</th>
              <th style={cell}>Install</th>
              <th style={cell}>Install $</th>
              <th style={cell}>Furnish</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td style={cell}>
                  <strong>{r.code}</strong>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{r.type}</div>
                </td>
                <td style={cell}>
                  <input style={num} type="number" step="0.01" value={r.materialCost}
                    onChange={(e) => set(i, { materialCost: parseFloat(e.target.value) || 0 })} />
                </td>
                <td style={cell}>
                  <input style={num} type="number" step="0.01" value={r.wastePct}
                    onChange={(e) => set(i, { wastePct: parseFloat(e.target.value) || 0 })} />
                </td>
                <td style={cell}>
                  <input style={num} type="number" step="1" value={r.cartonSize ?? ""}
                    onChange={(e) => set(i, { cartonSize: e.target.value === "" ? null : parseFloat(e.target.value) })} />
                </td>
                <td style={cell}>
                  <select style={{ ...num, width: 110 }} value={r.installMode}
                    onChange={(e) => set(i, { installMode: e.target.value })}>
                    <option value="unit_rate">unit rate</option>
                    <option value="sub_quote">sub quote</option>
                    <option value="pending">pending</option>
                  </select>
                </td>
                <td style={cell}>
                  <input style={num} type="number" step="0.01" value={r.installAmount ?? ""}
                    onChange={(e) => set(i, { installAmount: e.target.value === "" ? null : parseFloat(e.target.value) })} />
                </td>
                <td style={cell}>
                  <select style={{ ...num, width: 130 }} value={r.furnishType}
                    onChange={(e) => set(i, { furnishType: e.target.value })}>
                    <option value="furnish_and_sub">furnish + sub</option>
                    <option value="turnkey_sub">turnkey sub</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="form-actions" style={{ marginTop: 18 }}>
        <button className="btn btn-primary" disabled={pending}
          onClick={() => start(() => saveRates(projectId, rows))}>
          {pending ? "Saving…" : "Save rates"}
        </button>
        <span className="hint" style={{ margin: 0, padding: 0, border: 0 }}>
          Waste as a decimal (0.08 = 8%). Install $ = $/unit for “unit rate”, or the lump sum for “sub quote”.
        </span>
      </div>
    </div>
  );
}
