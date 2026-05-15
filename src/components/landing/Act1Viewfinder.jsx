/**
 * Act 1 — "Through the Viewfinder"
 *
 * Sticky 100vh inside a 150vh outer section. As the user scrolls the section:
 *   0.00–0.10  name fades in
 *   0.10–0.30  tagline 1 → 2
 *   0.30–0.55  tagline 2 → 3
 *   0.55–0.80  tagline 3 → 4
 *   0.80–1.00  whole HUD fades out, photo holds full-frame for the Act 2 handoff
 * Photo gets a slow scale (1.0 → 1.06) the whole way for a gentle ken-burns feel.
 * AF brackets pulse on each tagline change.
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ExifCard from './ExifCard';

gsap.registerPlugin(ScrollTrigger);

const HERO_PHOTO = '/photos/hong-kong/hero-web.jpg';

const TAGLINES = [
  'Photographer',
  'Storyteller',
  'Based in Singapore',
  'Chasing light across Asia',
];

export default function Act1Viewfinder() {
  const sectionRef = useRef(null);
  const photoRef   = useRef(null);
  const nameRef    = useRef(null);
  const tagRefs    = useRef([]);
  const bracketRef = useRef(null);
  const hudRef     = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // accessibility fallback handled by CSS

    const ctx = gsap.context(() => {
      // Initial states — name is the focal point and stays visible from frame 1
      gsap.set(tagRefs.current[0], { opacity: 1 });
      gsap.set(tagRefs.current.slice(1), { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      // Slow ken-burns on the photo
      tl.to(photoRef.current, { scale: 1.06, ease: 'none' }, 0);

      // Name has a gentle parallax drift (no opacity animation — visible from start)
      tl.to(nameRef.current, { y: -40, ease: 'none' }, 0);

      // Tagline crossfades
      tl.to(tagRefs.current[0], { opacity: 0 }, 0.22);
      tl.to(tagRefs.current[1], { opacity: 1 }, 0.22);
      tl.to(tagRefs.current[1], { opacity: 0 }, 0.47);
      tl.to(tagRefs.current[2], { opacity: 1 }, 0.47);
      tl.to(tagRefs.current[2], { opacity: 0 }, 0.72);
      tl.to(tagRefs.current[3], { opacity: 1 }, 0.72);

      // Bracket pulse — one pulse per tagline change
      [0.22, 0.47, 0.72].forEach((t) => {
        tl.fromTo(
          bracketRef.current,
          { scale: 1 },
          { scale: 1.06, duration: 0.04, yoyo: true, repeat: 1, ease: 'power1.inOut' },
          t
        );
      });

      // Act-out: HUD elements fade so Act 2 can take over cleanly
      tl.to(hudRef.current, { opacity: 0, ease: 'power2.in' }, 0.82);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="reel__act reel__act--1">
      <div className="reel__pin">
        {/* Background photo */}
        <div ref={photoRef} className="reel__bg">
          <img src={HERO_PHOTO} alt="" />
          <div className="reel__bg-tint" />
        </div>

        {/* HUD layer (subtle by default) */}
        <div ref={hudRef} className="reel__hud">
          {/* Top bar */}
          <div className="reel__hud-top">
            <span className="reel__hud-mode">M</span>
            <span>1/500</span>
            <span>F4</span>
            <span>ISO&thinsp;400</span>
            <span className="reel__hud-spacer" />
            <span className="reel__hud-meta">AWB · IS</span>
          </div>

          {/* AF brackets */}
          <div ref={bracketRef} className="reel__hud-af">
            <span className="reel__hud-bracket reel__hud-bracket--tl" />
            <span className="reel__hud-bracket reel__hud-bracket--tr" />
            <span className="reel__hud-bracket reel__hud-bracket--bl" />
            <span className="reel__hud-bracket reel__hud-bracket--br" />
          </div>

          {/* Bottom bar */}
          <div className="reel__hud-bot">
            <span>RAW+L</span>
            <span className="reel__hud-spacer" />
            <span>Frame 1 / 4</span>
          </div>

          {/* EXIF strip (real or fallback) */}
          <div className="reel__hud-exif">
            <ExifCard photo={HERO_PHOTO} compact />
          </div>
        </div>

        {/* Centre: name + morphing tagline */}
        <div className="reel__centre">
          <h1 ref={nameRef} className="reel__name">Jayden Ng</h1>
          <div className="reel__tag-stack">
            {TAGLINES.map((t, i) => (
              <span
                key={t}
                ref={(el) => (tagRefs.current[i] = el)}
                className="reel__tag"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll hint, fades with HUD */}
        <div className="reel__scroll-hint">
          <span>Scroll</span>
          <span className="reel__scroll-line" />
        </div>
      </div>
    </section>
  );
}
