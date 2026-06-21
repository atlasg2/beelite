"use client";

import { useRef, useState } from "react";

// Click-to-measure prototype. Step 1: click two ends of a known wall + type its length → feet/pixel.
// Step 2: click a room's corners → square feet (shoelace × scale²). Points are stored in the image's
// natural pixel space so the math is zoom-independent. Deliberately minimal.

type Pt = { x: number; y: number };
type Room = { id: number; pts: Pt[]; sf: number };

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const area = (pts: Pt[]) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    s += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(s) / 2;
};
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export function MeasureCanvas({ src }: { src: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [natW, setNatW] = useState(2000);
  const [natH, setNatH] = useState(1500);
  const [zoom, setZoom] = useState(0.18);
  const [step, setStep] = useState<"scale" | "measure">("scale");
  const [ftPerPx, setFtPerPx] = useState<number | null>(null);
  const [scalePts, setScalePts] = useState<Pt[]>([]);
  const [lenInput, setLenInput] = useState("");
  const [pts, setPts] = useState<Pt[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const idRef = useRef(1);

  const fitWidth = (w = natW) => {
    const el = boxRef.current?.parentElement;
    if (el) setZoom(Math.max(0.05, (el.clientWidth - 28) / w));
  };

  // map a click to natural image pixels
  const at = (e: React.MouseEvent): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * natW, y: ((e.clientY - r.top) / r.height) * natH };
  };

  const onClick = (e: React.MouseEvent) => {
    const p = at(e);
    if (step === "scale") {
      setScalePts((s) => (s.length >= 2 ? [p] : [...s, p])); // 3rd click starts a new line
      return;
    }
    if (pts.length >= 3 && dist(p, pts[0]) < 16 / zoom) {
      finishRoom();
      return;
    }
    setPts((c) => [...c, p]);
  };

  const lockScale = () => {
    const feet = parseFloat(lenInput);
    if (!feet || scalePts.length < 2) return;
    setFtPerPx(feet / dist(scalePts[0], scalePts[1]));
    setLenInput("");
    setStep("measure");
  };

  const finishRoom = () => {
    if (!ftPerPx || pts.length < 3) return;
    setRooms((r) => [...r, { id: idRef.current++, pts, sf: area(pts) * ftPerPx * ftPerPx }]);
    setPts([]);
  };

  const undo = () => (pts.length ? setPts((p) => p.slice(0, -1)) : setRooms((r) => r.slice(0, -1)));
  const clearAll = () => { setPts([]); setRooms([]); };
  const resetAll = () => { setPts([]); setRooms([]); setScalePts([]); setFtPerPx(null); setStep("scale"); };

  const liveSF = ftPerPx && pts.length >= 3 ? area(pts) * ftPerPx * ftPerPx : 0;
  const totalSF = rooms.reduce((s, r) => s + r.sf, 0);
  const dotR = 6 / zoom; // ~6px on screen

  return (
    <div style={S.app}>
      <header style={S.bar}>
        <strong style={{ fontSize: 15 }}>Takeoff digitizer <span style={S.tag}>prototype</span></strong>
        <div style={{ display: "flex", gap: 6, marginLeft: 14 }}>
          <button style={btn(step === "scale")} onClick={() => { setStep("scale"); setScalePts([]); setFtPerPx(null); }}>1 · Set scale</button>
          <button style={{ ...btn(step === "measure"), opacity: ftPerPx ? 1 : 0.45 }} disabled={!ftPerPx} onClick={() => setStep("measure")}>2 · Measure</button>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button style={S.icon} onClick={undo} disabled={!pts.length && !rooms.length}>↶ Undo</button>
          <button style={S.icon} onClick={clearAll} disabled={!pts.length && !rooms.length}>Clear</button>
          <button style={S.icon} onClick={() => setZoom((z) => z * 0.8)}>−</button>
          <button style={S.icon} onClick={() => fitWidth()}>Fit</button>
          <button style={S.icon} onClick={() => setZoom((z) => z * 1.25)}>＋</button>
        </div>
      </header>

      <div style={{ ...S.banner, ...(step === "scale" ? S.bannerScale : S.bannerMeasure) }}>
        {step === "scale"
          ? <>STEP 1 — click the <b>two ends</b> of the cyan <b>23&apos;-0&quot;</b> line on the left, then type <b>23</b> and Lock. {ftPerPx ? "✓ scale set — press “2 · Measure”." : ""}</>
          : <>STEP 2 — click each <b>corner</b> of a room, then click the <b>first dot again</b> to close it. Should read ≈ 104 SF for Bedroom 02.</>}
      </div>

      <div style={S.body}>
        <div style={S.stage}>
          <div ref={boxRef} style={{ position: "relative", width: natW * zoom, lineHeight: 0, cursor: "crosshair" }} onClick={onClick}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Floor plan"
              draggable={false}
              onLoad={(e) => { const w = e.currentTarget.naturalWidth, h = e.currentTarget.naturalHeight; setNatW(w); setNatH(h); fitWidth(w); }}
              style={{ width: "100%", display: "block", userSelect: "none", pointerEvents: "none" }}
            />
            <svg viewBox={`0 0 ${natW} ${natH}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              {rooms.map((rm) => (
                <polygon key={rm.id} points={rm.pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="rgba(224,167,58,.18)" stroke="#e0a73a" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              ))}
              {pts.length > 1 && <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#e0a73a" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />}
              {step === "measure" && pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={dotR} fill={i === 0 ? "#fff" : "#e0a73a"} stroke="#e0a73a" strokeWidth={2} vectorEffect="non-scaling-stroke" />)}
              {scalePts.length === 2 && <line x1={scalePts[0].x} y1={scalePts[0].y} x2={scalePts[1].x} y2={scalePts[1].y} stroke="#38b6d9" strokeWidth={2.5} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />}
              {step === "scale" && scalePts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={dotR} fill="#38b6d9" stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" />)}
            </svg>
          </div>
        </div>

        <aside style={S.panel}>
          <div style={S.readout}>
            <div style={S.readoutLbl}>{step === "measure" ? (pts.length >= 3 ? "Area — live" : "Click corners…") : "Square feet"}</div>
            <div style={S.readoutNum}>{step === "measure" && pts.length >= 3 ? fmt(liveSF) : rooms.length ? fmt(totalSF) : "0"} <span style={{ fontSize: 18, color: "#8b9099" }}>SF</span></div>
            <div style={{ fontSize: 12, color: "#9aa0a9" }}>{ftPerPx ? `scale set · ${ftPerPx.toPrecision(3)} ft/px` : "no scale yet"}</div>
          </div>

          {step === "scale" && scalePts.length >= 2 && (
            <div style={S.card}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>How long is that line, in feet?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input autoFocus inputMode="decimal" placeholder="23" value={lenInput} onChange={(e) => setLenInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lockScale()} style={S.input} />
                <button style={{ ...S.icon, background: "#38b6d9", color: "#06222b", borderColor: "#38b6d9" }} onClick={lockScale}>Lock scale</button>
              </div>
            </div>
          )}

          {step === "measure" && (
            <div style={S.card}>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.icon} onClick={finishRoom} disabled={pts.length < 3}>Close room</button>
                <button style={S.icon} onClick={() => setPts((p) => p.slice(0, -1))} disabled={!pts.length}>Undo point</button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={S.roomsH}>Rooms ({rooms.length}){rooms.length > 0 && <span style={{ color: "#e0a73a" }}>{fmt(totalSF)} SF</span>}</div>
            {rooms.length === 0 ? <div style={{ fontSize: 12.5, color: "#71767f" }}>No rooms yet.</div> : rooms.map((rm, i) => (
              <div key={rm.id} style={S.roomRow}><span>Room {i + 1}</span><span style={{ color: "#e0a73a", fontFamily: "ui-monospace,monospace" }}>{fmt(rm.sf)} SF</span></div>
            ))}
            <div style={{ marginTop: 14, fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "#8b9099", marginBottom: 6 }}>Where to click</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/measure-demo/click-guide.png" alt="Where to click guide" style={{ width: "100%", border: "1px solid #2a2f38", borderRadius: 8, background: "#fff", cursor: "zoom-in" }} onClick={() => window.open("/measure-demo/click-guide.png", "_blank")} />
          </div>

          <button onClick={resetAll} style={{ background: "none", border: "none", color: "#8b9099", textDecoration: "underline", cursor: "pointer", fontSize: 12, marginTop: 8 }}>Reset everything</button>
        </aside>
      </div>
    </div>
  );
}

const btn = (on: boolean): React.CSSProperties => ({
  background: on ? "rgba(56,182,217,.14)" : "transparent",
  border: `1px solid ${on ? "#38b6d9" : "#2a2f38"}`,
  color: on ? "#cfeefb" : "#aeb3bc",
  padding: "7px 13px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600,
});

const S: Record<string, React.CSSProperties> = {
  app: { position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#0f1115", color: "#e8eaed", fontFamily: "system-ui,-apple-system,sans-serif" },
  bar: { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#171a20", borderBottom: "1px solid #262b33" },
  tag: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "#0f1115", background: "#e0a73a", padding: "3px 6px", borderRadius: 4, marginLeft: 6 },
  icon: { minWidth: 34, height: 32, padding: "0 10px", background: "#1f242c", border: "1px solid #2a2f38", color: "#cdd2da", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  banner: { padding: "9px 16px", fontSize: 13.5, borderBottom: "1px solid #262b33" },
  bannerScale: { background: "rgba(56,182,217,.12)", color: "#cfeefb" },
  bannerMeasure: { background: "rgba(224,167,58,.12)", color: "#ffe9bf" },
  body: { flex: 1, display: "flex", minHeight: 0 },
  stage: { flex: 1, overflow: "auto", background: "#0c0e12", padding: 14 },
  panel: { flex: "0 0 320px", background: "#14171d", borderLeft: "1px solid #262b33", padding: 16, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" },
  readout: { background: "#1b1f27", border: "1px solid #2a2f38", borderRadius: 12, padding: 16 },
  readoutLbl: { fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "#8b9099", fontWeight: 600 },
  readoutNum: { fontFamily: "ui-monospace,monospace", fontSize: 46, fontWeight: 700, color: "#e0a73a", margin: "6px 0 4px" },
  card: { background: "#1a1e25", border: "1px solid #262b33", borderRadius: 10, padding: 12 },
  input: { flex: 1, background: "#0f1115", border: "1px solid #38b6d9", borderRadius: 8, color: "#fff", padding: "8px 11px", fontFamily: "ui-monospace,monospace", fontSize: 14, fontWeight: 600 },
  roomsH: { display: "flex", justifyContent: "space-between", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#8b9099", fontWeight: 600, marginBottom: 8 },
  roomRow: { display: "flex", justifyContent: "space-between", background: "#1a1e25", border: "1px solid #262b33", borderRadius: 8, padding: "7px 10px", marginBottom: 6, fontSize: 13 },
};
