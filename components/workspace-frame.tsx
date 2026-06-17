"use client";

import { useState } from "react";

// Wraps the workspace so the pipeline rail can be collapsed for a wider, clearer plan view.
export function WorkspaceFrame({ rail, children }: { rail: React.ReactNode; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`ws${collapsed ? " ws-collapsed" : ""}`}>
      <aside className="ws-rail">{rail}</aside>
      <main className="ws-main">
        <button type="button" className="ws-toggle" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? "☰  Show steps" : "‹  Hide steps"}
        </button>
        {children}
      </main>
    </div>
  );
}
