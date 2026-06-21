"use client";

import { useEffect, useRef, useState } from "react";

type Step = { title: string; body: string; icon: React.ReactNode };

// Desktop: once the grid scrolls into view, the steps reveal one at a time on
// a timer, each connector flowing into the next.
// Mobile (single column): each step reveals as it scrolls into view, and the
// connector draws downward into the next — the animation tracks your scroll.
export default function ProcessFlow({
  steps,
  interval = 600,
}: {
  steps: Step[];
  interval?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0); // desktop cascade count
  const [revealed, setRevealed] = useState<boolean[]>(() => steps.map(() => false)); // mobile per-card

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(steps.length);
      setRevealed(steps.map(() => true));
      return;
    }

    // Mobile: reveal each card independently as it enters the viewport.
    if (window.matchMedia("(max-width: 520px)").matches) {
      const cards = Array.from(el.querySelectorAll(".pstep"));
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const idx = cards.indexOf(e.target);
            setRevealed((prev) => {
              if (idx < 0 || prev[idx]) return prev;
              const next = [...prev];
              next[idx] = true;
              return next;
            });
            io.unobserve(e.target);
          });
        },
        { threshold: 0.4, rootMargin: "0px 0px -10% 0px" }
      );
      cards.forEach((c) => io.observe(c));
      return () => io.disconnect();
    }

    // Desktop: timed cascade once the grid scrolls into view.
    let timer: ReturnType<typeof setInterval> | undefined;
    const play = () => {
      setShown(1);
      let i = 1;
      timer = setInterval(() => {
        i += 1;
        setShown(i);
        if (i >= steps.length && timer) clearInterval(timer);
      }, interval);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          play();
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [steps.length, interval]);

  return (
    <div ref={ref} className="procgrid">
      {steps.map((s, i) => (
        <div
          className={`pstep${revealed[i] || i < shown ? " is-shown" : ""}`}
          key={s.title}
        >
          <span className="pstep__icon">{s.icon}</span>
          {/* Connector flows into the next step as it reveals */}
          {i < steps.length - 1 && <span className="pstep__link" aria-hidden="true" />}
          <h3 className="pstep__title">{s.title}</h3>
          <p className="pstep__body">{s.body}</p>
        </div>
      ))}
    </div>
  );
}
