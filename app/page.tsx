import SiteHeader from "./components/SiteHeader";
import HeroSlideshow from "./components/HeroSlideshow";
import { ParallaxServices } from "./components/ServiceSections";
import { Capabilities } from "./components/Capabilities";
import { AdvImageTop } from "./components/AdvantageLayouts";
import { AboutOverlay } from "./components/AboutLayouts";
import { QuoteCentered } from "./components/QuoteSections";
import Footer from "./components/Footer";
import { CONTENT_A, CONTENT_B } from "./components/serviceContent";

// Homepage services:
//  - "Now" alternating-rows section uses the scope-forward copy.
//  - "Parallax" section mixes copy: flooring scope-forward, fitness "favorites".
const PARALLAX_MIX = [CONTENT_B[0], CONTENT_A[1]];

export default function Page() {
  return (
    <>
      <SiteHeader />

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <HeroSlideshow />
        </section>

        <AdvImageTop scheme="black haccent" />

        <ParallaxServices items={PARALLAX_MIX} anchored />

        <Capabilities variant="light" />

        <AboutOverlay />

        <QuoteCentered decor="blueprint" theme="lightcard" anchored />
      </main>

      <Footer />
    </>
  );
}
