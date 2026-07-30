/**
 * Act 3 — "The Contact Sheet"
 *
 * The whole curated pool is laid out as a numbered contact sheet. As you
 * scroll, four frames are *chosen*: each lifts out of its cell, enlarges to
 * fill the stage, HOLDS completely still, then settles back. The section ends
 * on the full bright sheet, handing off to the Gallery.
 *
 * Why a contact sheet: it's the tool photographers actually use to select, so
 * the metaphor matches the mechanic — the shuffle reads as "today's edit"
 * rather than as randomness. It also shows the body of work and the individual
 * photograph at the same time, which isolated floating frames can't do.
 *
 * Two tiers are used deliberately: sheet cells pull the 800px WebP thumbnails
 * (9 small cells, ~93 KB each), the enlarged stage frame pulls full photos-web.
 */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { featured as pool } from '../../data/featured';
import { thumbSrc } from '../../utils/thumb';
import ExifCard from './ExifCard';
import PhotoLightbox from './PhotoLightbox';

gsap.registerPlugin(ScrollTrigger);

// How many of the pool get enlarged per scroll pass. The sheet always shows
// every photo; only the selection rotates.
const SELECT_COUNT = 4;

// Dim level for unselected cells while the stage is active. Deep enough that
// the select clearly dominates, light enough that the sheet still reads as a
// body of work — below ~0.3 the darker photos vanish into the background.
const DIM = 0.38;

function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Sheet order is STABLE (it should feel like your sheet); the selection
// shuffles per load. Sorted ascending so enlargements progress across the
// sheet instead of jumping around.
const selectedIdx = shuffle(pool.map((_, i) => i))
  .slice(0, Math.min(SELECT_COUNT, pool.length))
  .sort((a, b) => a - b);

export default function Act3Work() {
  const sectionRef = useRef(null);
  const pinRef     = useRef(null);
  const stageRef   = useRef(null);
  const headRef    = useRef(null);
  const outroRef   = useRef(null);
  const cellRefs   = useRef([]);
  const frameRefs  = useRef([]);
  const [lbIndex, setLbIndex] = useState(null);

  // Lightbox browses the whole sheet, in sheet order.
  const lbPhotos = useMemo(
    () => pool.map((f) => ({ src: f.photo, city: f.city, country: f.country })),
    []
  );

  // Delta from a stage frame's resting position (the stage's centre, since it's
  // inset:0 + margin:auto) to cell `p`, plus the scale that makes the frame
  // match that cell's size. offsetWidth is used deliberately — it's a layout
  // value, so it isn't corrupted by GSAP's in-flight transform.
  // Read at animation time via function-based GSAP values + invalidateOnRefresh,
  // so a resize re-derives them instead of reusing stale numbers.
  const offsetFor = useCallback((p, frameEl) => {
    const cell  = cellRefs.current[p];
    const stage = stageRef.current;
    if (!cell || !stage || !frameEl) return { dx: 0, dy: 0, s: 0.3 };
    const c = cell.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    return {
      dx: (c.left + c.width  / 2) - (s.left + s.width  / 2),
      dy: (c.top  + c.height / 2) - (s.top  + s.height / 2),
      s:  Math.max(0.05, c.width / Math.max(1, frameEl.offsetWidth)),
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Mobile renders a plain tappable grid — no pin, no scrubbing.
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const ctx = gsap.context(() => {
      const cells  = cellRefs.current.filter(Boolean);
      const frames = frameRefs.current.filter(Boolean);
      if (!cells.length || !frames.length) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end:   'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // Heading in, then out before the sheet takes over.
      tl.fromTo(headRef.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.03 }, 0);
      tl.to(headRef.current, { autoAlpha: 0, y: -10, duration: 0.03 }, 0.07);

      // Sheet settles in.
      tl.fromTo('.sheet',
        { autoAlpha: 0, scale: 0.97 },
        { autoAlpha: 1, scale: 1, ease: 'power2.out', duration: 0.06 },
        0.06);

      // Dim every cell ONCE and leave them dim. Dimming the container per
      // cycle flickers, and cells can't brighten above a dimmed parent.
      tl.to(cells, { opacity: DIM, duration: 0.02 }, 0.12);

      // ── Four select cycles ──────────────────────────────────────────────
      const SPAN  = 0.72;                        // 0.14 → 0.86
      const START = 0.14;
      const cycle = SPAN / frames.length;

      selectedIdx.forEach((p, n) => {
        const at    = START + n * cycle;
        const frame = frames[n];
        const mark  = cells[p].querySelector('.sheet__mark');

        // Lift out of the cell (first 25%)
        tl.fromTo(frame,
          {
            x: () => offsetFor(p, frame).dx,
            y: () => offsetFor(p, frame).dy,
            scale: () => offsetFor(p, frame).s,
            autoAlpha: 0,
          },
          { x: 0, y: 0, scale: 1, autoAlpha: 1, ease: 'power2.out', duration: cycle * 0.25 },
          at);
        tl.to(cells[p], { opacity: 1, duration: cycle * 0.12 }, at);
        if (mark) tl.to(mark, { opacity: 1, duration: cycle * 0.12 }, at);

        // HOLD (middle 45%) — nothing animates. The photograph is still.

        // Settle back (last 30%)
        tl.to(frame, { autoAlpha: 0, scale: 0.97, ease: 'power2.in', duration: cycle * 0.3 },
          at + cycle * 0.7);
        tl.to(cells[p], { opacity: DIM, duration: cycle * 0.2 }, at + cycle * 0.75);
        if (mark) tl.to(mark, { opacity: 0, duration: cycle * 0.2 }, at + cycle * 0.75);
      });

      // Sheet returns to full, gallery link appears.
      tl.to(cells, { opacity: 1, duration: 0.05 }, 0.88);
      tl.fromTo(outroRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.05 },
        0.92);
    }, sectionRef);

    return () => ctx.revert();
  }, [offsetFor]);

  return (
    <section ref={sectionRef} className="reel__act reel__act--3">
      <div ref={pinRef} className="reel__pin">
        <div ref={headRef} className="reel__act3-head">
          <span className="reel__act3-eyebrow">Selected work</span>
          <h2 className="reel__act3-heading">The Contact Sheet</h2>
          <p className="reel__act3-hint">Today's edit — click any frame to open it</p>
        </div>

        {/* The sheet — every photo in the pool, stable order */}
        <div className="sheet">
          <div className="sheet__grid">
            {pool.map((item, i) => (
              <figure
                key={item.photo}
                ref={(el) => (cellRefs.current[i] = el)}
                className="sheet__cell"
                onClick={() => setLbIndex(i)}
              >
                <img
                  src={thumbSrc(item.photo)}
                  alt={`${item.city}, ${item.country}`}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
                <span className="sheet__mark" />
                <figcaption className="sheet__num">{String(i + 1).padStart(2, '0')}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* The stage — enlarged selects, one visible at a time */}
        <div ref={stageRef} className="sheet__stage">
          {selectedIdx.map((p, n) => (
            <figure
              key={pool[p].photo}
              ref={(el) => (frameRefs.current[n] = el)}
              className="sheet__frame"
              onClick={() => setLbIndex(p)}
            >
              <img src={pool[p].photo} alt={`${pool[p].city}, ${pool[p].country}`} draggable="false" />
              <ExifCard photo={pool[p].photo} compact className="sheet__frame-exif" />
            </figure>
          ))}
        </div>

        <a ref={outroRef} className="sheet__cta" href="/gallery">
          See the full gallery
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </a>
      </div>

      <AnimatePresence>
        {lbIndex !== null && (
          <PhotoLightbox
            photos={lbPhotos}
            index={lbIndex}
            onClose={() => setLbIndex(null)}
            onPrev={() => setLbIndex((i) => (i - 1 + lbPhotos.length) % lbPhotos.length)}
            onNext={() => setLbIndex((i) => (i + 1) % lbPhotos.length)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
