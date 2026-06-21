"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDES = [
  {
    src: "/hero/hero-1.jpg",
    alt: "Commercial weight-room flooring with custom logo tiles",
    eyebrow: "Commercial Flooring Experts",
    titleTop: "Installed",
    titleBottom: "Nationwide",
    body: "Weight rooms, retail floors, and offices — Elite installs commercial flooring coast to coast. Local crews, full logistics, and a finish that's ready on schedule.",
    href: "/flooring-installation",
  },
  {
    src: "/hero/hero-2.jpg",
    alt: "High-end fitness facility with full equipment install",
    eyebrow: "Fitness Equipment Specialists",
    titleTop: "Assembled",
    titleBottom: "On-Site",
    body: "Racks, cardio, cable machines, platforms — we assemble and install every piece, floor-ready and safe, so your members can train day one.",
    href: "#fitness",
  },
];

const INTERVAL = 6000;

export default function HeroSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      INTERVAL
    );
    return () => clearInterval(id);
  }, []);

  const go = (dir: number) =>
    setActive((i) => (i + dir + SLIDES.length) % SLIDES.length);

  const slide = SLIDES[active];

  return (
    <>
      <div className="hero__bg" aria-hidden="true">
        {SLIDES.map((s, i) => (
          <div
            key={s.src}
            className={`hero__slide${i === active ? " is-active" : ""}`}
          >
            <Image
              src={s.src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              quality={85}
              style={{ objectFit: "cover" }}
            />
          </div>
        ))}
        <div className="hero__scrim" />
      </div>

      <div className="hero__inner">
        <div className="hero__copy">
          <p className="hero__eyebrow" key={`eyebrow-${active}`}>
            {slide.eyebrow}
          </p>
          <h1 id="hero-title" className="display">
            <span className="display__swap" key={active}>
              <span className="display__line">
                <span className="display__text">{slide.titleTop}</span>
              </span>
              <span className="display__line">
                <span className="display__text">{slide.titleBottom}</span>
                <span className="display__rule display__rule--red" aria-hidden="true" />
              </span>
            </span>
          </h1>
          <p className="lede">
            <span className="lede__swap" key={active}>{slide.body}</span>
          </p>

          <div className="cta-row" key={active}>
            <a href={slide.href} className="btn btn--solid btn--thin">
              Learn more
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="hero__arrow hero__arrow--prev"
        aria-label="Previous slide"
        onClick={() => go(-1)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        className="hero__arrow hero__arrow--next"
        aria-label="Next slide"
        onClick={() => go(1)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );
}
