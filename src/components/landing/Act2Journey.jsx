/**
 * Act 2 — "The Journey"
 *
 * Camera pulls back: a map of Asia fades in, then city pins drop in
 * chronological order as scroll progresses. A live counter ticks up
 * (cities · countries · frames) in sync with the pins.
 *
 * Reuses the existing GlobeSection in "passive" mode (no clicks, no chrome,
 * just the canvas) with a `visibleSlugs` prop driving which pins render.
 */
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cities } from '../../data/cities';

gsap.registerPlugin(ScrollTrigger);

// Lazy-load GlobeSection (Leaflet is heavy, ~80KB)
const GlobeSection = lazy(() => import('../GlobeSection'));

// Order cities by year, then by name within a year (deterministic)
const orderedCities = [...cities].sort((a, b) => {
  if (a.year !== b.year) return a.year.localeCompare(b.year);
  return a.name.localeCompare(b.name);
});

const TOTAL_CITIES    = orderedCities.length;
const TOTAL_COUNTRIES = new Set(orderedCities.map((c) => c.country)).size;
// Earliest year in the gallery → current year. Auto-updates as time passes
// and as new cities/photos are added.
const FIRST_YEAR      = orderedCities[0]?.year ?? '2023';
const CURRENT_YEAR    = new Date().getFullYear();
const YEAR_RANGE      = `${FIRST_YEAR} — ${CURRENT_YEAR}`;
// Real count: unique published photos — same dedup logic as GalleryPage.
const _seen = new Set();
orderedCities.forEach((c) => {
  if (c.heroImage && !c.heroImage.includes('placeholder')) _seen.add(c.heroImage);
  (c.photos ?? []).forEach((p) => _seen.add(typeof p === 'string' ? p : p.src));
});
const TOTAL_FRAMES = _seen.size;

// Where in the act's scroll progress the pin sequence happens
const REVEAL_START = 0.10;
const REVEAL_END   = 0.70;

export default function Act2Journey() {
  const sectionRef = useRef(null);
  const mapWrapRef = useRef(null);
  const counterRef = useRef(null);
  const prevCount  = useRef(-1);

  const [revealed, setRevealed] = useState(new Set());
  const [counter, setCounter]   = useState({ cities: 0, countries: 0, frames: 0 });

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // Show everything immediately
      setRevealed(new Set(orderedCities.map((c) => c.slug)));
      setCounter({ cities: TOTAL_CITIES, countries: TOTAL_COUNTRIES, frames: TOTAL_FRAMES });
      return;
    }

    const ctx = gsap.context(() => {
      // Map fades in at the start, holds, fades out near the end
      gsap.set(mapWrapRef.current, { opacity: 0 });
      // Counter centering is handled by the .reel__counter-anchor wrapper
      gsap.set(counterRef.current, { opacity: 0, y: 20 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start:   'top top',
          end:     'bottom bottom',
          scrub:   1,
          onUpdate: (self) => {
            const p = self.progress;
            const frac = (p - REVEAL_START) / (REVEAL_END - REVEAL_START);
            const clamped = Math.max(0, Math.min(1, frac));
            const count = Math.floor(clamped * TOTAL_CITIES);

            // Only update state when the integer count crosses a boundary
            if (count !== prevCount.current) {
              prevCount.current = count;
              const slugs = orderedCities.slice(0, count).map((c) => c.slug);
              setRevealed(new Set(slugs));
              const countries = new Set(orderedCities.slice(0, count).map((c) => c.country)).size;
              const frames    = Math.round(clamped * TOTAL_FRAMES);
              setCounter({ cities: count, countries, frames });
            } else if (count > 0) {
              // Smooth the frames counter inside the same city window
              const frames = Math.round(clamped * TOTAL_FRAMES);
              setCounter((c) => (c.frames === frames ? c : { ...c, frames }));
            }
          },
        },
      });

      tl.to(mapWrapRef.current, { opacity: 1, ease: 'power2.out' }, 0)
        .to(counterRef.current, { opacity: 1, y: 0, duration: 0.2 }, 0.05)
        .to(mapWrapRef.current, { opacity: 0.55, ease: 'power2.in' }, 0.85)
        .to(counterRef.current, { opacity: 0, y: -10, duration: 0.15 }, 0.88);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="reel__act reel__act--2">
      <div className="reel__pin">
        <div ref={mapWrapRef} className="reel__map-wrap">
          <Suspense fallback={<div className="reel__map-fallback" />}>
            <GlobeSection
              mode="passive"
              visibleSlugs={revealed}
            />
          </Suspense>
          <div className="reel__map-vignette" />
        </div>

        {/* Live counter overlay (CSS-centered anchor, GSAP only animates inner) */}
        <div className="reel__counter-anchor">
          <div ref={counterRef} className="reel__counter">
          <div className="reel__counter-item">
            <span className="reel__counter-num">{String(counter.cities).padStart(2, '0')}</span>
            <span className="reel__counter-label">Cities</span>
          </div>
          <div className="reel__counter-divider" />
          <div className="reel__counter-item">
            <span className="reel__counter-num">{String(counter.countries).padStart(2, '0')}</span>
            <span className="reel__counter-label">Countries</span>
          </div>
          <div className="reel__counter-divider" />
          <div className="reel__counter-item">
            <span className="reel__counter-num">{String(counter.frames).padStart(3, '0')}</span>
            <span className="reel__counter-label">Frames</span>
          </div>
          </div>
        </div>

        {/* Eyebrow heading */}
        <div className="reel__act2-head">
          <span className="reel__act2-eyebrow">Across Asia · {YEAR_RANGE}</span>
          <h2 className="reel__act2-heading">The Journey</h2>
        </div>
      </div>
    </section>
  );
}
