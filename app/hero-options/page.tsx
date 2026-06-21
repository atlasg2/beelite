import HeroSlideshow from "../components/HeroSlideshow";
import "./hero-options.css";

export const metadata = {
  title: "Hero readability options",
  robots: { index: false, follow: false },
};

// Each entry renders the real hero with one readability treatment applied
// via a modifier class (styles in hero-options.css).
const OPTS = [
  { cls: "hero--glow", tag: "Option 1 — Stronger glow / shadow (image fully bright)" },
  { cls: "hero--shade", tag: "Option 2 — Soft shade behind the text" },
  { cls: "hero--panel", tag: "Option 3 — Frosted glass panel" },
  { cls: "hero--bold", tag: "Option 4 — Bolder, brighter text only" },
  { cls: "hero--combo", tag: "Option 5 — Shade + bolder (combo)" },
];

export default function HeroOptionsPage() {
  return (
    <main>
      {OPTS.map((o) => (
        <section key={o.cls} className={`hero ${o.cls}`} aria-label={o.tag}>
          <span className="hero-opt-tag">{o.tag}</span>
          <HeroSlideshow />
        </section>
      ))}
    </main>
  );
}
