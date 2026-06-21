"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Flooring Installation", href: "/flooring-installation" },
  { label: "Fitness Equipment", href: "/#fitness" },
  { label: "About", href: "/#about" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile menu is open, and close on Escape.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="Elite Installation Services — home">
        <Image
          src="/site/logo.png"
          alt="Elite Installation Services"
          width={600}
          height={255}
          priority
          className="brand__logo"
        />
      </a>

      <nav className="nav" aria-label="Primary">
        {NAV.map((item) => (
          <a key={item.href} href={item.href} className="nav__link">
            {item.label}
          </a>
        ))}
      </nav>

      <a href="/#contact" className="btn btn--solid btn--sm nav__quote">
        Contact
      </a>

      <button
        className={`hamburger${open ? " is-open" : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>

      <div
        id="mobile-menu"
        className={`mobilenav${open ? " is-open" : ""}`}
        aria-hidden={!open}
        onClick={(e) => {
          // Close when the backdrop (not the panel) is clicked.
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <nav className="mobilenav__list" aria-label="Mobile">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="mobilenav__link"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            href="/#contact"
            className="btn btn--solid mobilenav__quote"
            onClick={() => setOpen(false)}
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
