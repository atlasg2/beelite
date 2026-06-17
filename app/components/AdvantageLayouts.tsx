import Image from "next/image";
import Reveal from "./Reveal";

const PinIcon = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const ClockIcon = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 7v5.2l3.4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ShieldIcon = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l7 3v5c0 4.6-3 8.1-7 9-4-.9-7-4.4-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 11.8l2 2 4.2-4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ADV = [
  {
    n: "01",
    title: "Eliminate Travel Costs",
    body: "Skip the travel costs of sending installers to your customer's location — we use technicians local to the area.",
    img: "/service-flooring.jpg",
    icon: PinIcon,
  },
  {
    n: "02",
    title: "Stay on Schedule",
    body: "With local installers, inevitable product-delivery delays no longer throw a major wrench into the installation schedule.",
    img: "/hero-3.jpg",
    icon: ClockIcon,
  },
  {
    n: "03",
    title: "Provide Quality Service",
    body: "Quality assembly and installation work, delivered through solid training and efficient, repeatable processes.",
    img: "/service-fitness.jpg",
    icon: ShieldIcon,
  },
];

const Head = () => (
  <Reveal className="adv__head reveal">
    <p className="section-eyebrow reveal-item">The Elite advantage</p>
    <h2 className="adv__title reveal-item">Why teams keep choosing Elite</h2>
  </Reveal>
);

/* A — image-top cards. `scheme` accepts space-separated modifiers,
   e.g. "black haccent". */
export function AdvImageTop({ scheme }: { scheme?: string }) {
  const mods = scheme
    ? " " + scheme.trim().split(/\s+/).map((s) => `adv--${s}`).join(" ")
    : "";
  return (
    <section className={`adv${mods}`} aria-label="The Elite advantage">
      <Head />
      <Reveal className="adv__grid reveal">
        {ADV.map((a) => (
          <article className="advcard reveal-item" key={a.title}>
            <div className="advcard__media">
              <Image src={a.img} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" quality={85} />
            </div>
            <div className="advcard__body">
              <h3 className="advcard__title">{a.title}</h3>
              <p className="advcard__text">{a.body}</p>
            </div>
          </article>
        ))}
      </Reveal>
    </section>
  );
}

/* B — photo overlay cards */
export function AdvOverlay() {
  return (
    <section className="adv" aria-label="The Elite advantage">
      <Head />
      <Reveal className="adv__grid reveal">
        {ADV.map((a) => (
          <article className="ovcard reveal-item" key={a.title}>
            <Image src={a.img} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" quality={85} />
            <div className="ovcard__scrim" />
            <div className="ovcard__content">
              <span className="ovcard__icon">{a.icon}</span>
              <h3 className="ovcard__title">{a.title}</h3>
              <p className="ovcard__text">{a.body}</p>
            </div>
          </article>
        ))}
      </Reveal>
    </section>
  );
}

