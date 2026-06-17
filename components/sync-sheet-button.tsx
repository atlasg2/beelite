"use client";

import { useState, useTransition } from "react";
import { syncBidToSheet } from "@/app/actions";

export function SyncSheetButton({ projectId, sheetId }: { projectId: string; sheetId: string | null }) {
  const [pending, start] = useTransition();
  const [url, setUrl] = useState<string | null>(
    sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null
  );
  const [msg, setMsg] = useState<string | null>(null);

  function sync() {
    setMsg(null);
    start(async () => {
      const res = await syncBidToSheet(projectId);
      if (res.ok && res.url) {
        setUrl(res.url);
        setMsg(res.created ? "Created in your Google Drive." : "Updated — numbers are live.");
      } else {
        setMsg(res.error ?? "Sync failed.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
      <button type="button" className="btn btn-primary" onClick={sync} disabled={pending}>
        {pending ? "Syncing…" : url ? "Re-sync to Google Sheet" : "Sync to Google Sheet"}
      </button>
      {url && (
        <a className="btn" href={url} target="_blank" rel="noreferrer">
          Open in Sheets ↗
        </a>
      )}
      {msg && <span className="card-meta" style={{ color: "var(--muted)" }}>{msg}</span>}
    </div>
  );
}
