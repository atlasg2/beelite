import Image from "next/image";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import ServiceHero from "../components/ServiceHero";
import Reveal from "../components/Reveal";
import ProcessFlow from "../components/ProcessFlow";
import { QuoteCentered } from "../components/QuoteSections";

const SERVE = [
  { label: "Commercial Offices", img: "/site/hero-3.jpg" },
  { label: "Fitness Centers", img: "/site/service-fitness.jpg" },
  { label: "Retail Spaces", img: "/site/service-flooring.jpg" },
];

const DIFF = [
  "Cost-Effective Deployments",
  "Efficient Project Management",
  "Local Expertise, Nationwide Reach",
  "Product Warehousing",
  "Reliable, High-Quality Installations",
];

const Check = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12.5l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const metadata = {
  title: "Flooring Installation",
  description:
    "Nationwide commercial flooring installation — local crews, full logistics, and a precise final-mile process for fitness, retail, and commercial spaces.",
  alternates: { canonical: "/flooring-installation" },
};

const FEATURES = [
  {
    title: "Eliminate Travel Costs",
    body: "Our nationwide network deploys locally or regionally — cutting flights, rental cars, hotels, and per diem off your invoice.",
    img: "/site/service-flooring.jpg",
  },
  {
    title: "Expand Your Team",
    body: "Boost capacity without the overhead. Tap a trained crew instantly and skip recruiting, training, and payroll.",
    img: "/hero/hero-1.jpg",
  },
  {
    title: "Reliable, High-Quality Installs",
    body: "Skilled technicians backed by rigorous training deliver dependable, high-quality work that protects your reputation.",
    img: "/site/hero-3.jpg",
  },
  {
    title: "Meet Tight Deadlines",
    body: "A flexible nationwide team adapts fast to changing schedules and keeps tight project timelines on track.",
    img: "/site/service-fitness.jpg",
  },
];

const PROCESS = [
  {
    title: "Set requirements & schedule",
    body: "Define project needs and timing for a tailored, seamless plan.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Truck materials to site",
    body: "Move product from your warehouse — or ours — securely, with no delays.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6h11v9H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 9h4l3 3v3h-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="7" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.5" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    title: "Confirm details",
    body: "Verify everything with the customer for clear, aligned communication.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5h16v11H9l-4 3v-3H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8.5 10l2 2 4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Stage materials",
    body: "Organize and prep the project space so the install runs efficiently.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="8" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Install the flooring",
    body: "Install with craftsmanship and stability built to last.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14.7 6.3a3.5 3.5 0 0 0-4.6 4.2l-6 6 2.1 2.1 6-6a3.5 3.5 0 0 0 4.2-4.6l-2.1 2.1-1.6-1.6 2-2.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Final check of work",
    body: "A thorough check that every requirement and standard is met.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="6" y="4" width="12" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 3.5h6V7H9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 13l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Report back",
    body: "Prompt completion details — transparency and assurance, job done.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 3L3 11l7 2.8L13 21l8-18z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M21 3L10 13.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function FlooringPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <ServiceHero
          crumb="Flooring Installation"
          eyebrow="Nationwide · Commercial Flooring Installers"
          titleLines={["Flooring", "Installation"]}
          lede="We install commercial, fitness, and retail flooring with precision — built for durability and safety, and finished on schedule so your space is ready for business."
          attrs={["Skilled technicians", "Logistics support", "Thorough communication", "Experience & commitment"]}
          img="/site/service-flooring.jpg"
        />

        {/* Section 2 — why partner with Elite */}
        <section className="adv adv--black adv--haccent" aria-label="Why partner with Elite">
          <Reveal className="adv__head reveal">
            <p className="section-eyebrow reveal-item">Why partner with Elite</p>
            <h2 className="adv__title reveal-item">Stay focused on selling. We handle the logistics.</h2>
          </Reveal>
          <Reveal className="adv__grid adv__grid--4 reveal">
            {FEATURES.map((f) => (
              <article className="advcard reveal-item" key={f.title}>
                <div className="advcard__media">
                  <Image src={f.img} alt="" fill sizes="(max-width: 1100px) 50vw, 25vw" quality={85} />
                </div>
                <div className="advcard__body">
                  <h3 className="advcard__title">{f.title}</h3>
                  <p className="advcard__text">{f.body}</p>
                </div>
              </article>
            ))}
          </Reveal>
        </section>

        {/* Section 3 — final-mile process */}
        <section className="procsec" aria-label="Our process">
          <Reveal className="procsec__head reveal">
            <p className="section-eyebrow reveal-item">Final-mile services</p>
            <h2 className="procsec__title reveal-item">Precision from the first plan to the final check</h2>
            <p className="procsec__intro reveal-item">
              A meticulous process from initial planning to finishing touches — a flawless,
              reliable flooring installation, every time.
            </p>
          </Reveal>

          <ProcessFlow steps={PROCESS} />
        </section>

        {/* Section 4 — proudly serving */}
        <section className="serve" aria-label="Proudly serving">
          <Reveal className="serve__head reveal">
            <p className="section-eyebrow reveal-item">Proudly serving</p>
            <h2 className="serve__title reveal-item">Spaces we install</h2>
          </Reveal>
          <Reveal className="serve__grid reveal">
            {SERVE.map((s) => (
              <article className="servetile reveal-item" key={s.label}>
                <Image src={s.img} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" quality={85} />
                <div className="servetile__scrim" />
                <h3 className="servetile__label">{s.label}</h3>
              </article>
            ))}
          </Reveal>
        </section>

        {/* Section 5 — the Elite difference */}
        <section className="diff" aria-label="The Elite difference">
          <div className="diff__grid">
            <Reveal className="diff__text reveal">
              <p className="section-eyebrow reveal-item">The Elite difference</p>
              <h2 className="diff__title reveal-item">
                Elevating your experience in commercial flooring installation
              </h2>
              <p className="diff__body reveal-item">
                Our dedication to excellence sets us apart — unmatched expertise,
                professionalism, and flexibility across commercial, fitness, and retail
                flooring. A nationwide network of skilled installers delivers cost-effective,
                precise results from the first plan through final installation.
              </p>
            </Reveal>
            <Reveal className="diff__list reveal">
              {DIFF.map((d) => (
                <div className="diffitem reveal-item" key={d}>
                  <span className="diffitem__check">{Check}</span>
                  <span className="diffitem__label">{d}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Section 6 — request a quote */}
        <QuoteCentered decor="blueprint" theme="lightcard" kicker="for Flooring Installation Services" />
      </main>

      <Footer />
    </>
  );
}
