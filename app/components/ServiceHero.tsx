import Image from "next/image";
import Reveal from "./Reveal";

export default function ServiceHero({
  crumb,
  eyebrow,
  titleLines,
  lede,
  attrs,
  img,
}: {
  crumb: string;
  eyebrow: string;
  titleLines: string[];
  lede: string;
  attrs: string[];
  img: string;
}) {
  return (
    <section className="shero" aria-labelledby="shero-title">
      <div className="shero__bg" aria-hidden="true">
        <Image src={img} alt="" fill priority sizes="100vw" quality={85} />
        <div className="shero__scrim" />
      </div>

      <div className="shero__inner">
        <nav className="shero__crumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <span>{crumb}</span>
        </nav>

        <Reveal className="shero__copy reveal">
          <p className="shero__eyebrow reveal-item">{eyebrow}</p>
          <h1 id="shero-title" className="shero__title">
            {titleLines.map((l) => (
              <span className="mask-line" key={l}>
                <span className="mask-line__text">{l}</span>
              </span>
            ))}
            <span className="shero__rule" aria-hidden="true" />
          </h1>
          <p className="shero__lede reveal-item">{lede}</p>
          <ul className="shero__attrs reveal-item">
            {attrs.map((a) => (
              <li className="chip" key={a}>
                <span className="chip__dot" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
