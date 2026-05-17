/**
 * Act 1 — "Through the Viewfinder"
 *
 * Sticky 100vh inside a 220vh outer section. Each tagline gets ~25% of the
 * scroll range, with quick 5% crossfades between them so the reader has time
 * to actually read each line at full opacity.
 *   0.00–0.25  "Photographer"            (read window ~25vh of scroll)
 *   0.25–0.30  crossfade 1 → 2
 *   0.30–0.50  "Storyteller"             (read window)
 *   0.50–0.55  crossfade 2 → 3
 *   0.55–0.75  "Based in Singapore"      (read window)
 *   0.75–0.80  crossfade 3 → 4
 *   0.80–1.00  "Chasing light across Asia" (read window through to Act 2 handoff)
 * Photo gets a slow scale (1.0 → 1.06) the whole way for a gentle ken-burns feel.
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HERO_PHOTO = '/photos-web/hong-kong/_MG_3601.JPG';

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

      // Tagline crossfades — short, explicit durations so each line gets a
      // long hold at full opacity. Default GSAP duration (0.5) was eating ~50%
      // of the scroll on a single fade, causing the "too fast" feel.
      const FADE = 0.05;
      tl.to(tagRefs.current[0], { opacity: 0, duration: FADE }, 0.25);
      tl.to(tagRefs.current[1], { opacity: 1, duration: FADE }, 0.25);
      tl.to(tagRefs.current[1], { opacity: 0, duration: FADE }, 0.50);
      tl.to(tagRefs.current[2], { opacity: 1, duration: FADE }, 0.50);
      tl.to(tagRefs.current[2], { opacity: 0, duration: FADE }, 0.75);
      tl.to(tagRefs.current[3], { opacity: 1, duration: FADE }, 0.75);
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

        {/* Scroll hint */}
        <div className="reel__scroll-hint">
          <span>Scroll</span>
          <span className="reel__scroll-line" />
        </div>
      </div>
    </section>
  );
}
