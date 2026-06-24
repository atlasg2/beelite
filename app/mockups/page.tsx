"use client";

import { useState } from "react";

// ── Clickable design prototypes ─────────────────────────────────────────────
// Two FULLY different directions you can navigate: Bids → open a bid → workspace,
// and New bid. Structurally distinct on purpose (left-sidebar dense spreadsheet
// vs. top-nav airy cards) so the choice is obvious. Fake data, scoped CSS.

type Bid = { id: string; name: string; loc: string; status: string; tone: string; chips: string[]; due: string; price: string };
const BIDS: Bid[] = [
  { id: "tg", name: "Transfiguration Gym", loc: "New Orleans, LA", status: "Pricing", tone: "work", chips: ["VCT-1", "EPX-1", "RB-1"], due: "Jun 28", price: "$18,420" },
  { id: "mt", name: "Midlands Tech — CGT Flooring", loc: "Columbia, SC", status: "Ready to bid", tone: "ready", chips: ["CPT-1", "LVT-1", "ST-2"], due: "Jul 02", price: "$42,180" },
  { id: "bc", name: "Blood Center — Tenant Build-out", loc: "New Orleans, LA", status: "Reading plans", tone: "read", chips: [], due: "Jul 09", price: "—" },
  { id: "cm", name: "Campus Multipurpose Reno", loc: "Newport News, VA", status: "Confirmed", tone: "ok", chips: ["CPT", "VCT", "RB"], due: "Jul 14", price: "$27,640" },
  { id: "cc", name: "1215 Convention Center Hotel", loc: "New Orleans, LA", status: "Synced", tone: "sync", chips: ["LVT-2", "PT-1"], due: "—", price: "$96,310" },
];

type Fin = { code: string; type: string; qty: string; unit: string; mat: string; inst: string; line: string };
const FINS: Fin[] = [
  { code: "CPT-1", type: "Carpet tile", qty: "1,240", unit: "SF", mat: "3.20", inst: "0.95", line: "$5,146" },
  { code: "LVT-1", type: "Luxury vinyl", qty: "860", unit: "SF", mat: "2.85", inst: "1.55", line: "$3,784" },
  { code: "RB-1", type: "Rubber base", qty: "420", unit: "LF", mat: "0.92", inst: "1.10", line: "$848" },
  { code: "VCT-1", type: "VCT", qty: "2,100", unit: "SF", mat: "1.05", inst: "1.10", line: "$4,515" },
  { code: "ST-2", type: "Stair nosing", qty: "38", unit: "EA", mat: "14.00", inst: "9.00", line: "$874" },
];

/* ══════════════════ DIRECTION A — SHEET (dense, gridded, green, sidebar) ══════════════════ */
const SHEET_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');
.sa * { box-sizing:border-box; margin:0; padding:0; }
.sa { --bg:#F4F6F7; --sf:#fff; --ink:#15171C; --mut:#6E747E; --line:#E5E8EC; --acc:#0B875B; --soft:#E2F2EA; --aink:#076B46;
  display:grid; grid-template-columns:236px 1fr; min-height:calc(100vh - 52px);
  background:var(--bg); color:var(--ink); font-family:'Hanken Grotesk',sans-serif; font-variant-numeric:tabular-nums; }
.sa-side { background:var(--sf); border-right:1px solid var(--line); padding:22px 14px; display:flex; flex-direction:column; gap:24px; }
.sa-brand { display:flex; align-items:center; gap:10px; }
.sa-logo { width:28px; height:28px; border-radius:7px; background:var(--acc); color:#fff; display:grid; place-items:center; font-weight:800; font-size:15px; }
.sa-bname { font-weight:700; font-size:18px; letter-spacing:-.02em; }
.sa-new { font:inherit; font-size:13.5px; font-weight:600; color:#fff; background:var(--acc); border:none; padding:10px; border-radius:9px; cursor:pointer; box-shadow:0 1px 2px rgba(11,135,91,.3); }
.sa-nav { display:flex; flex-direction:column; gap:2px; }
.sa-nav a { font-size:13.5px; font-weight:600; color:var(--mut); padding:8px 11px; border-radius:8px; cursor:pointer; }
.sa-nav a.on { color:var(--aink); background:var(--soft); }
.sa-foot { margin-top:auto; font-size:12px; color:var(--mut); display:flex; align-items:center; gap:7px; }
.sa-foot i { width:7px; height:7px; border-radius:50%; background:var(--acc); }
.sa-main { padding:28px 34px; min-width:0; }
.sa-eye { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--mut); }
.sa-h1 { font-size:26px; font-weight:700; letter-spacing:-.025em; margin:5px 0 3px; }
.sa-sub { font-size:13.5px; color:var(--mut); }
.sa-top { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom:20px; }
.sa-search { font-size:13px; color:var(--mut); padding:9px 13px; border:1px solid var(--line); border-radius:9px; background:var(--sf); }
.sa-card { background:var(--sf); border:1px solid var(--line); border-radius:12px; overflow:hidden; box-shadow:0 1px 2px rgba(16,18,24,.04); }
.sa-table { width:100%; border-collapse:collapse; }
.sa-table th { text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--mut); background:#F6F8F9; padding:10px 15px; border-bottom:1px solid var(--line); }
.sa-table th.r, .sa-table td.r { text-align:right; }
.sa-table th:not(:last-child), .sa-table td:not(:last-child) { border-right:1px solid var(--line); }
.sa-table td { padding:12px 15px; border-bottom:1px solid var(--line); font-size:13.5px; }
.sa-table tbody tr { cursor:pointer; }
.sa-table tbody tr:hover { background:#F7FAF8; }
.sa-table tr:last-child td { border-bottom:none; }
.sa-name { font-weight:600; }
.sa-mut { color:var(--mut); }
.sa-num { color:var(--mut); font-weight:600; }
.sa-chips { display:inline-flex; gap:5px; flex-wrap:wrap; }
.sa-chip { font-size:11.5px; font-weight:600; background:#F1F3F5; border:1px solid var(--line); border-radius:6px; padding:1px 7px; }
.sa-badge { font-size:11.5px; font-weight:600; padding:3px 9px; border-radius:7px; white-space:nowrap; }
.sa-badge.work{color:#9A5600;background:#F8ECD9} .sa-badge.ready{color:#1F5FCC;background:#E6EEFB} .sa-badge.read{color:var(--mut);background:#EDEFF1} .sa-badge.ok{color:var(--aink);background:var(--soft)} .sa-badge.sync{color:#fff;background:var(--acc)}
.sa-back { font-size:13px; font-weight:600; color:var(--mut); cursor:pointer; display:inline-flex; gap:5px; align-items:center; margin-bottom:14px; }
.sa-price { display:flex; align-items:baseline; gap:10px; margin:4px 0 22px; }
.sa-price b { font-size:32px; font-weight:800; letter-spacing:-.03em; color:var(--aink); }
.sa-price span { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--mut); }
.sa-drop { border:1.5px dashed var(--line); border-radius:14px; background:var(--sf); padding:48px; text-align:center; }
.sa-drop b { display:block; font-size:16px; font-weight:700; margin-bottom:4px; }
.sa-drop span { color:var(--mut); font-size:13.5px; }
.sa-form { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:18px; max-width:560px; }
.sa-field { display:flex; flex-direction:column; gap:5px; }
.sa-field label { font-size:12px; font-weight:600; color:var(--mut); }
.sa-field input { font:inherit; font-size:14px; padding:9px 11px; border:1px solid var(--line); border-radius:9px; background:var(--sf); }
.sa-wide { grid-column:1 / -1; }
`;

function SheetApp() {
  const [screen, setScreen] = useState<"bids" | "work" | "new">("bids");
  const [bid, setBid] = useState(BIDS[0]);
  return (
    <div className="sa">
      <style dangerouslySetInnerHTML={{ __html: SHEET_CSS }} />
      <aside className="sa-side">
        <div className="sa-brand"><span className="sa-logo">B</span><span className="sa-bname">Beelite</span></div>
        <button className="sa-new" onClick={() => setScreen("new")}>+ New bid</button>
        <nav className="sa-nav">
          <a className={screen !== "new" ? "on" : ""} onClick={() => setScreen("bids")}>Bids</a>
          <a>Standard rates</a>
        </nav>
        <div className="sa-foot"><i /> Synced to Google Sheets</div>
      </aside>
      <main className="sa-main">
        {screen === "bids" && (
          <>
            <div className="sa-top">
              <div><div className="sa-eye">Pipeline</div><h1 className="sa-h1">Bids</h1><p className="sa-sub">Every bid, from plan upload to submission.</p></div>
              <div className="sa-search">Search bids…</div>
            </div>
            <div className="sa-card">
              <table className="sa-table">
                <thead><tr><th>Bid</th><th>Location</th><th>Status</th><th>Scope</th><th className="r">Bid price</th></tr></thead>
                <tbody>
                  {BIDS.map((b) => (
                    <tr key={b.id} onClick={() => { setBid(b); setScreen("work"); }}>
                      <td className="sa-name">{b.name}</td>
                      <td className="sa-mut">{b.loc}</td>
                      <td><span className={`sa-badge ${b.tone}`}>{b.status}</span></td>
                      <td>{b.chips.length ? <span className="sa-chips">{b.chips.map((c) => <span key={c} className="sa-chip">{c}</span>)}</span> : <span className="sa-mut">—</span>}</td>
                      <td className="r sa-num">{b.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {screen === "work" && (
          <>
            <span className="sa-back" onClick={() => setScreen("bids")}>‹ Bids</span>
            <div className="sa-eye">{bid.loc}</div>
            <h1 className="sa-h1">{bid.name}</h1>
            <div className="sa-price"><b>{bid.price}</b><span>Bid price · synced</span></div>
            <div className="sa-card">
              <table className="sa-table">
                <thead><tr><th>Finish</th><th>Qty</th><th className="r">Material $/u</th><th className="r">Install $/u</th><th className="r">Line</th></tr></thead>
                <tbody>
                  {FINS.map((f) => (
                    <tr key={f.code}>
                      <td><span className="sa-name">{f.code}</span> <span className="sa-mut">{f.type}</span></td>
                      <td className="sa-num">{f.qty} {f.unit}</td>
                      <td className="r sa-num">${f.mat}</td>
                      <td className="r sa-num">${f.inst}</td>
                      <td className="r sa-num" style={{ color: "var(--aink)", fontWeight: 700 }}>{f.line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {screen === "new" && (
          <>
            <span className="sa-back" onClick={() => setScreen("bids")}>‹ Bids</span>
            <h1 className="sa-h1">New bid</h1>
            <p className="sa-sub">Drop the plan set — Beelite reads it and fills in the rest.</p>
            <div className="sa-drop" style={{ marginTop: 16 }}><b>Drop the plan PDF here</b><span>An architectural set works best</span></div>
            <div className="sa-form">
              <div className="sa-field sa-wide"><label>Project name</label><input defaultValue="Blood Center — Tenant Build-out" /></div>
              <div className="sa-field"><label>GC / Customer</label><input placeholder="From the cover sheet" /></div>
              <div className="sa-field"><label>Bid due</label><input placeholder="mm / dd / yyyy" /></div>
            </div>
            <div style={{ marginTop: 18 }}><button className="sa-new" style={{ padding: "10px 20px" }}>Create bid</button></div>
          </>
        )}
      </main>
    </div>
  );
}

/* ══════════════════ DIRECTION B — STUDIO (airy, top-nav, cards, cobalt) ══════════════════ */
const STUDIO_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&display=swap');
.st * { box-sizing:border-box; margin:0; padding:0; }
.st { --bg:#FBFBFD; --sf:#fff; --ink:#15151C; --mut:#83838F; --line:#ECECF1; --acc:#2D5BFF; --soft:#EBF0FF;
  min-height:calc(100vh - 52px); background:var(--bg); color:var(--ink); font-family:'Hanken Grotesk',sans-serif; }
.st-nav { display:flex; align-items:center; gap:26px; padding:18px 48px; border-bottom:1px solid var(--line); background:rgba(255,255,255,.8); backdrop-filter:blur(8px); position:sticky; top:52px; z-index:2; }
.st-brand { display:flex; align-items:center; gap:10px; font-weight:800; font-size:19px; letter-spacing:-.02em; }
.st-logo { width:28px; height:28px; border-radius:8px; background:var(--ink); color:#fff; display:grid; place-items:center; font-weight:900; font-size:15px; }
.st-links { display:flex; gap:6px; }
.st-links a { font-size:14px; font-weight:600; color:var(--mut); padding:7px 13px; border-radius:9px; cursor:pointer; }
.st-links a.on { color:var(--ink); background:#F1F1F5; }
.st-new { margin-left:auto; font:inherit; font-size:14px; font-weight:600; color:#fff; background:var(--acc); border:none; padding:10px 18px; border-radius:10px; cursor:pointer; box-shadow:0 2px 8px rgba(45,91,255,.3); }
.st-main { padding:44px 48px; max-width:1180px; margin:0 auto; }
.st-eye { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.14em; color:var(--acc); }
.st-h1 { font-size:42px; font-weight:800; letter-spacing:-.035em; line-height:1.02; margin:10px 0 8px; }
.st-sub { font-size:16px; color:var(--mut); }
.st-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-top:30px; }
.st-bcard { background:var(--sf); border:1px solid var(--line); border-radius:18px; padding:22px; cursor:pointer; transition:transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
.st-bcard:hover { transform:translateY(-2px); box-shadow:0 12px 30px rgba(20,20,30,.08); border-color:#dadae3; }
.st-bcard-top { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; }
.st-bname { font-size:18.5px; font-weight:700; letter-spacing:-.02em; line-height:1.2; }
.st-bloc { font-size:13.5px; color:var(--mut); margin-top:3px; }
.st-bprice { font-size:22px; font-weight:800; letter-spacing:-.03em; }
.st-brow { display:flex; align-items:center; gap:8px; margin-top:18px; flex-wrap:wrap; }
.st-chip { font-size:12.5px; font-weight:600; color:var(--acc); background:var(--soft); border-radius:8px; padding:3px 9px; }
.st-badge { font-size:12.5px; font-weight:600; padding:4px 11px; border-radius:999px; }
.st-badge.work{color:#9A5600;background:#F7ECDA} .st-badge.ready{color:var(--acc);background:var(--soft)} .st-badge.read{color:var(--mut);background:#F0F0F4} .st-badge.ok{color:#1B7F54;background:#E5F4EC} .st-badge.sync{color:#fff;background:var(--ink)}
.st-back { font-size:14px; font-weight:600; color:var(--mut); cursor:pointer; display:inline-flex; gap:6px; margin-bottom:20px; }
.st-price { display:flex; align-items:baseline; gap:12px; margin:6px 0 30px; }
.st-price b { font-size:52px; font-weight:900; letter-spacing:-.04em; }
.st-price span { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--mut); }
.st-fcard { background:var(--sf); border:1px solid var(--line); border-radius:18px; overflow:hidden; }
.st-ftable { width:100%; border-collapse:collapse; }
.st-ftable th { text-align:left; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--mut); padding:16px 24px; border-bottom:1px solid var(--line); }
.st-ftable th.r, .st-ftable td.r { text-align:right; }
.st-ftable td { padding:18px 24px; border-bottom:1px solid var(--line); font-size:15px; }
.st-ftable tr:last-child td { border-bottom:none; }
.st-ftable tbody tr:hover { background:#FAFAFC; }
.st-fname { font-weight:700; } .st-fmut { color:var(--mut); font-weight:500; }
.st-drop { border:2px dashed var(--line); border-radius:22px; background:var(--sf); padding:64px; text-align:center; }
.st-drop b { display:block; font-size:20px; font-weight:800; letter-spacing:-.02em; margin-bottom:6px; }
.st-drop span { color:var(--mut); font-size:15px; }
.st-form { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:22px; max-width:620px; }
.st-field { display:flex; flex-direction:column; gap:6px; }
.st-field.wide { grid-column:1 / -1; }
.st-field label { font-size:13px; font-weight:600; color:var(--mut); }
.st-field input { font:inherit; font-size:15px; padding:12px 14px; border:1px solid var(--line); border-radius:12px; background:var(--sf); }
`;

function StudioApp() {
  const [screen, setScreen] = useState<"bids" | "work" | "new">("bids");
  const [bid, setBid] = useState(BIDS[0]);
  return (
    <div className="st">
      <style dangerouslySetInnerHTML={{ __html: STUDIO_CSS }} />
      <nav className="st-nav">
        <span className="st-brand"><span className="st-logo">B</span>Beelite</span>
        <span className="st-links">
          <a className={screen !== "new" ? "on" : ""} onClick={() => setScreen("bids")}>Bids</a>
          <a>Standard rates</a>
        </span>
        <button className="st-new" onClick={() => setScreen("new")}>+ New bid</button>
      </nav>
      <main className="st-main">
        {screen === "bids" && (
          <>
            <div className="st-eye">Pipeline</div>
            <h1 className="st-h1">Bids</h1>
            <p className="st-sub">Every bid, from plan upload to submission.</p>
            <div className="st-grid">
              {BIDS.map((b) => (
                <div key={b.id} className="st-bcard" onClick={() => { setBid(b); setScreen("work"); }}>
                  <div className="st-bcard-top">
                    <div><div className="st-bname">{b.name}</div><div className="st-bloc">{b.loc}</div></div>
                    <div className="st-bprice">{b.price}</div>
                  </div>
                  <div className="st-brow">
                    <span className={`st-badge ${b.tone}`}>{b.status}</span>
                    {b.chips.map((c) => <span key={c} className="st-chip">{c}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {screen === "work" && (
          <>
            <span className="st-back" onClick={() => setScreen("bids")}>‹ Back to bids</span>
            <div className="st-eye">{bid.loc}</div>
            <h1 className="st-h1">{bid.name}</h1>
            <div className="st-price"><b>{bid.price}</b><span>Bid price</span></div>
            <div className="st-fcard">
              <table className="st-ftable">
                <thead><tr><th>Finish</th><th>Quantity</th><th className="r">Material $/u</th><th className="r">Install $/u</th><th className="r">Line cost</th></tr></thead>
                <tbody>
                  {FINS.map((f) => (
                    <tr key={f.code}>
                      <td><span className="st-fname">{f.code}</span>&nbsp;&nbsp;<span className="st-fmut">{f.type}</span></td>
                      <td className="st-fmut">{f.qty} {f.unit}</td>
                      <td className="r st-fmut">${f.mat}</td>
                      <td className="r st-fmut">${f.inst}</td>
                      <td className="r" style={{ fontWeight: 800 }}>{f.line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {screen === "new" && (
          <>
            <span className="st-back" onClick={() => setScreen("bids")}>‹ Back to bids</span>
            <h1 className="st-h1">New bid</h1>
            <p className="st-sub">Drop the plan set — Beelite reads it and fills in the rest.</p>
            <div className="st-drop" style={{ marginTop: 24 }}><b>Drop the plan PDF here</b><span>An architectural set works best</span></div>
            <div className="st-form">
              <div className="st-field wide"><label>Project name</label><input defaultValue="Blood Center — Tenant Build-out" /></div>
              <div className="st-field"><label>GC / Customer</label><input placeholder="From the cover sheet" /></div>
              <div className="st-field"><label>Bid due</label><input placeholder="mm / dd / yyyy" /></div>
            </div>
            <div style={{ marginTop: 22 }}><button className="st-new" style={{ marginLeft: 0 }}>Create bid</button></div>
          </>
        )}
      </main>
    </div>
  );
}

export default function Mockups() {
  const [dir, setDir] = useState<"sheet" | "studio">("sheet");
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e10" }}>
      <div style={{ height: 52, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", background: "#0e0e10", borderBottom: "1px solid #26262a", position: "sticky", top: 0, zIndex: 10, fontFamily: "system-ui" }}>
        <span style={{ color: "#8a8a92", fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginRight: 8 }}>Try both</span>
        {([["sheet", "Sheet", "Dense spreadsheet · green"], ["studio", "Studio", "Airy cards · cobalt"]] as const).map(([k, label, note]) => (
          <button key={k} onClick={() => setDir(k)} style={{
            fontFamily: "system-ui", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left",
            padding: "7px 14px", borderRadius: 8, border: "1px solid " + (dir === k ? "#3a3a40" : "transparent"),
            background: dir === k ? "#1c1c20" : "transparent", color: dir === k ? "#fff" : "#9a9aa2",
            display: "flex", flexDirection: "column", lineHeight: 1.3,
          }}>
            <span>{label}</span>
            <span style={{ fontSize: 10.5, fontWeight: 500, color: dir === k ? "#7a7a82" : "#5a5a62" }}>{note}</span>
          </button>
        ))}
        <span style={{ color: "#5a5a62", fontSize: 11.5, marginLeft: "auto" }}>Click a bid · open it · try “New bid”</span>
      </div>
      {dir === "sheet" ? <SheetApp /> : <StudioApp />}
    </div>
  );
}
