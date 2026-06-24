import type { ReactNode } from "react";
import Link from "next/link";

/** Clean brand header: tile logo + wordmark, optional action on the right. */
export function SiteHeader({ action }: { action?: ReactNode }) {
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        <svg className="logo" viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" rx="11" fill="#0f766e" />
          <g fill="#ffffff" opacity="0.92">
            <rect x="10" y="10" width="8.5" height="8.5" rx="2" />
            <rect x="21.5" y="10" width="8.5" height="8.5" rx="2" opacity="0.65" />
            <rect x="10" y="21.5" width="8.5" height="8.5" rx="2" opacity="0.65" />
            <rect x="21.5" y="21.5" width="8.5" height="8.5" rx="2" />
          </g>
        </svg>
        <div>
          <div className="brand-name">Beelite</div>
        </div>
      </Link>
      {action}
    </header>
  );
}
