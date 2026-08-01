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

// Gap between the shifted sheet and the enlarged frame.
const PAIR_GAP = 72;

// Columns scale with the pool so the sheet keeps a roughly square footprint
// and never grows taller than the 100vh pin. Adding photos makes the frames
// smaller rather than making the sheet longer — which is how a real contact
// sheet behaves. 9 -> 3 cols, 16 -> 4, 25 -> 5, 36 -> 6.
const COLUMNS = Math.max(3, Math.ceil(Math.sqrt(pool.length)));

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
  const gridRef    = useRef(null);
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

  // Both the sheet and the stage frame rest dead-centre in the pin. While a
  // select is up they need to sit side by side, so we shift each outward by
  // half the pair's total width. Derived from real widths at runtime, which
  // keeps the composition balanced from 1024px to ultrawide.
  const layoutShift = useCallback(() => {
    const grid  = gridRef.current;
    const frame = frameRefs.current[0];
    if (!grid || !frame) return { grid: 0, frame: 0 };
    const gw = grid.offsetWidth;
    const fw = frame.offsetWidth;
    const total = gw + PAIR_GAP + fw;
    return {
      grid:  -(total / 2) + gw / 2,
      frame:  (total / 2) - fw / 2,
    };
  }, []);

  // Delta from the stage frame's resting position (pin centre) to cell `p`,
  // plus the scale that makes the frame match that cell. offsetWidth is used
  // deliberately — it's a layout value, so GSAP's in-flight transform can't
  // corrupt it. The cell rect already includes the sheet's shift, so no
  // correction is needed there.
  // Read at animation time via function-based GSAP values + invalidateOnRefresh,
  // so a resize re-derives them instead of reusing stale numbers.
  const offsetFor = useCallback((p, frameEl) => {
    const cell = cellRefs.current[p];
    const pin  = pinRef.current;
    if (!cell || !pin || !frameEl) return { dx: 0, dy: 0, s: 0.3 };
    const c = cell.getBoundingClientRect();
    const b = pin.getBoundingClientRect();
    return {
      dx: (c.left + c.width  / 2) - (b.left + b.width  / 2),
      dy: (c.top  + c.height / 2) - (b.top  + b.height / 2),
      s:  Math.max(0.05, c.width / Math.max(1, frameEl.offsetWidth)),
    };
  }, []);

  // Rebuild the timeline when the desktop/mobile breakpoint is crossed.
  // Without this, loading below 768px and then widening leaves Act 3 stuck in
  // its static mobile state until a reload, because the effect below only ran
  // once and bailed early.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(max-width: 768px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsDesktop(!e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Mobile renders a plain tappable grid — no pin, no scrubbing.
    if (!isDesktop) return;

    const ctx = gsap.context(() => {
      const cells  = cellRefs.current.filter(Boolean);
      const frames = frameRefs.current.filter(Boolean);
      if (!cells.length || !frames.length) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end:   'bottom bottom',
          // 0.3, not 1. Lenis already eases scroll by ~1.1s; a scrub of 1 on
          // top of that put the animation ~2s behind the wheel. Each select
          // only occupies ~54vh, so you'd scroll past the whole window before
          // its photo appeared — the section read as static. Act 2 can afford
          // scrub:1 because its content is continuous; discrete appearances
          // can't.
          scrub: 0.3,
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

      // Sheet slides from centre to its left seat, making room for the stage.
      tl.to(gridRef.current,
        { x: () => layoutShift().grid, ease: 'power2.inOut', duration: 0.04 },
        0.11);

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
          {
            x: () => layoutShift().frame,   // right seat, not dead centre
            y: 0, scale: 1, autoAlpha: 1,
            ease: 'power2.out', duration: cycle * 0.25,
          },
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

      // Sheet returns to centre at full brightness, gallery link appears.
      tl.to(gridRef.current, { x: 0, ease: 'power2.inOut', duration: 0.05 }, 0.87);
      tl.to(cells, { opacity: 1, duration: 0.05 }, 0.88);
      tl.fromTo(outroRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.05 },
        0.92);
    }, sectionRef);

    // Safety net: re-measure once everything has actually loaded. Images in
    // this and earlier acts settle after mount, and a trigger created against
    // a not-yet-final layout would map scroll to the wrong progress.
    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === 'complete') {
      requestAnimationFrame(onLoad);
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      window.removeEventListener('load', onLoad);
      ctx.revert();
    };
  }, [offsetFor, layoutShift, isDesktop]);

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
          <div
            ref={gridRef}
            className="sheet__grid"
            style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}
          >
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
        <div className="sheet__stage">
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
