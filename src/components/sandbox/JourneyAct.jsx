/**
 * JourneyAct — SANDBOX. Merges Act 2 (map) and Act 3 (contact sheet) into one.
 *
 * Not linked from anywhere. Viewable at /sandbox/journey so it can be compared
 * against the live acts before anything replaces them.
 *
 * The thesis: the pins become the photographs.
 *
 *   map establishes -> pins drop in arrival order -> each pin expands into that
 *   city's photograph AT ITS OWN COORDINATES (they overlap, because the cities
 *   cluster) -> the frames resolve out of that overlap into a contact sheet over
 *   a faint, unlabelled map -> a few enlarge -> handoff to the gallery.
 *
 * The overlap is the point. Geography becoming an edit is the one moment here
 * that could not be lifted onto another product.
 *
 * How the pivot works without GSAP Flip (a Club plugin we don't have): each
 * frame's RESTING position is its natural CSS-grid cell. We only ever animate a
 * transform away from that resting state and back to zero, so the grid does the
 * layout maths and GSAP only moves pixels. Geographic positions come from
 * Leaflet's own projection via latLngToContainerPoint.
 */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'leaflet/dist/leaflet.css';
import { cities } from '../../data/cities';
import { thumbSrc } from '../../utils/thumb';
import ExifCard from '../landing/ExifCard';
import PhotoLightbox from '../landing/PhotoLightbox';

gsap.registerPlugin(ScrollTrigger);

// Carto's label layer is split from the base so the two can be cross-faded.
// Labels do real work while this is a map and none once it is a sheet — country
// names showing through the gaps between photographs read as clutter.
const TILE_BASE   = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
const TILE_LABELS = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png';

// Frames come from cities that actually have a photograph. Hangzhou is in
// cities.js with heroImage: null until its import runs, so it contributes a pin
// to the geography but not yet a frame — which is honest, and self-correcting.
const FRAMES = cities.filter((c) => c.heroImage);
const COLUMNS = Math.max(3, Math.ceil(Math.sqrt(FRAMES.length)));
const SELECT_COUNT = 4;
const DIM = 0.34;

function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Which frames enlarge. Sorted so the enlargements progress across the sheet
// rather than jumping around it.
const selectedIdx = shuffle(FRAMES.map((_, i) => i))
  .slice(0, Math.min(SELECT_COUNT, FRAMES.length))
  .sort((a, b) => a - b);

/** Lifts the Leaflet instance out so the overlay can project coordinates. */
function MapBridge({ onReady }) {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.keyboard.disable();
    // Passive: nothing here should take focus or announce itself.
    map.getContainer().setAttribute('tabindex', '-1');
    map.getContainer().setAttribute('aria-hidden', 'true');
    onReady(map);
  }, [map, onReady]);
  return null;
}

export default function JourneyAct() {
  const sectionRef = useRef(null);
  const pinRef     = useRef(null);
  const mapWrapRef = useRef(null);
  const labelsRef  = useRef(null);
  const gridRef    = useRef(null);
  const headRef    = useRef(null);
  const outroRef   = useRef(null);
  const cellRefs   = useRef([]);
  const stageRefs  = useRef([]);

  const [map, setMap]         = useState(null);
  const [lbIndex, setLbIndex] = useState(null);

  const lbPhotos = useMemo(
    () => FRAMES.map((c) => ({ src: c.heroImage, city: c.name, country: c.country })),
    []
  );

  const bounds = useMemo(() => {
    const lats = cities.map((c) => c.lat);
    const lons = cities.map((c) => c.lon);
    const pad = 0.10;
    const dLat = (Math.max(...lats) - Math.min(...lats)) * pad;
    const dLon = (Math.max(...lons) - Math.min(...lons)) * pad;
    return [
      [Math.min(...lats) - dLat, Math.min(...lons) - dLon],
      [Math.max(...lats) + dLat, Math.max(...lons) + dLon],
    ];
  }, []);

  /**
   * Delta from a frame's resting grid cell to where that city actually is on
   * the map, plus the scale that shrinks it to pin size. Read at animation time
   * through function-based GSAP values so a resize re-derives rather than
   * reusing stale numbers.
   */
  const geoOffset = useCallback((i) => {
    const cell = cellRefs.current[i];
    const city = FRAMES[i];
    if (!map || !cell || !city) return { dx: 0, dy: 0, s: 0.06 };
    const pt   = map.latLngToContainerPoint([city.lat, city.lon]);
    const box  = map.getContainer().getBoundingClientRect();
    // Measure the UNTRANSFORMED wrapper, not the button. getBoundingClientRect
    // on the button returns its current transformed rect, so deriving the delta
    // from it chases a moving target — pins drifted into open ocean.
    const c    = (cell.parentElement ?? cell).getBoundingClientRect();
    return {
      dx: (box.left + pt.x) - (c.left + c.width / 2),
      dy: (box.top  + pt.y) - (c.top  + c.height / 2),
      s:  Math.max(0.04, 18 / Math.max(1, cell.offsetWidth)),
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const ctx = gsap.context(() => {
      const cells  = cellRefs.current.filter(Boolean);
      const stages = stageRefs.current.filter(Boolean);
      if (!cells.length) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
          invalidateOnRefresh: true,
        },
      });

      // ── Map establishes ──────────────────────────────────────────────
      tl.fromTo(mapWrapRef.current,
        { autoAlpha: 0 }, { autoAlpha: 1, ease: 'power2.out', duration: 0.08 }, 0);
      tl.fromTo(headRef.current,
        { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.02);

      // ── Pins drop, in arrival order ──────────────────────────────────
      // Each frame starts AT its city, pin-sized, photograph hidden.
      const PIN_START = 0.12, PIN_SPAN = 0.20;
      cells.forEach((cell, i) => {
        const at = PIN_START + (i / cells.length) * PIN_SPAN;

        // The glyph lives inside the cell, so the cell's pin-phase scale (~0.13)
        // would shrink a 10px dot to about 1px. Counter-scale it by 1/s so it
        // renders at its true size while its parent is still pin-sized.
        const glyph = cell.querySelector('.journey__glyph');
        if (glyph) {
          tl.set(glyph, { scale: () => 1 / Math.max(0.001, geoOffset(i).s) }, 0);
        }

        tl.fromTo(cell,
          {
            x: () => geoOffset(i).dx,
            y: () => geoOffset(i).dy - 26,
            scale: () => geoOffset(i).s,
            autoAlpha: 0,
          },
          {
            x: () => geoOffset(i).dx,
            y: () => geoOffset(i).dy,
            scale: () => geoOffset(i).s,
            autoAlpha: 1,
            ease: 'power3.out',
            duration: 0.05,
          },
          at);
      });

      // ── The pivot ────────────────────────────────────────────────────
      // Pin glyph out, photograph in, and every frame travels from its own
      // coordinates to its cell in the sheet. They overlap on the way.
      const PIVOT = 0.36, PIVOT_LEN = 0.15;
      tl.to('.journey__glyph', { autoAlpha: 0, duration: PIVOT_LEN * 0.3 }, PIVOT);
      tl.to('.journey__photo', { autoAlpha: 1, duration: PIVOT_LEN * 0.5 }, PIVOT);
      tl.to('.journey__label', { autoAlpha: 1, duration: PIVOT_LEN * 0.4 }, PIVOT + PIVOT_LEN * 0.6);

      cells.forEach((cell, i) => {
        tl.to(cell, {
          x: 0, y: 0, scale: 1,
          ease: 'expo.out',                 // exponential ease-out, per the floor
          duration: PIVOT_LEN,
        }, PIVOT + (i / cells.length) * (PIVOT_LEN * 0.35));
      });

      // Map recedes but stays as evidence; its labels leave entirely.
      tl.to(mapWrapRef.current, { opacity: 0.16, duration: PIVOT_LEN }, PIVOT);
      if (labelsRef.current) {
        tl.to(labelsRef.current, { opacity: 0, duration: PIVOT_LEN * 0.6 }, PIVOT);
      }

      // ── Selects ──────────────────────────────────────────────────────
      // Sheet slides left and the enlargement takes the right. Centred, the
      // frame covers the sheet completely, which defeats the whole point —
      // you should see the body of work and the single photograph at once.
      const PAIR_GAP = 52;
      const pairShift = () => {
        const g = gridRef.current, f = stages[0];
        if (!g || !f) return { grid: 0, frame: 0 };
        const total = g.offsetWidth + PAIR_GAP + f.offsetWidth;
        return {
          grid:  -(total / 2) + g.offsetWidth / 2,
          frame:  (total / 2) - f.offsetWidth / 2,
        };
      };

      const SEL_START = 0.54, SEL_SPAN = 0.32;
      const cycle = SEL_SPAN / Math.max(1, stages.length);
      tl.to(cells, { opacity: DIM, duration: 0.02 }, SEL_START - 0.02);
      tl.to(gridRef.current,
        { x: () => pairShift().grid, ease: 'power2.inOut', duration: 0.04 }, SEL_START - 0.03);

      selectedIdx.forEach((p, n) => {
        const at = SEL_START + n * cycle;
        const stage = stages[n];
        if (!stage) return;
        tl.fromTo(stage,
          { autoAlpha: 0, scale: 0.94, x: () => pairShift().frame },
          { autoAlpha: 1, scale: 1, x: () => pairShift().frame,
            ease: 'expo.out', duration: cycle * 0.26 }, at);
        tl.to(cells[p], { opacity: 1, duration: cycle * 0.12 }, at);
        // hold — the photograph is still
        tl.to(stage, { autoAlpha: 0, ease: 'power2.in', duration: cycle * 0.28 },
          at + cycle * 0.72);
        tl.to(cells[p], { opacity: DIM, duration: cycle * 0.18 }, at + cycle * 0.76);
      });

      // ── Sheet at rest ────────────────────────────────────────────────
      tl.to(gridRef.current, { x: 0, ease: 'power2.inOut', duration: 0.05 }, 0.87);
      tl.to(cells, { opacity: 1, duration: 0.04 }, 0.88);
      tl.fromTo(outroRef.current,
        { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.91);
    }, sectionRef);

    // Re-fit and re-measure once layout settles; the pinned section can size
    // late, and a transform derived from a stale rect lands in the wrong place.
    const refit = () => { map.invalidateSize({ animate: false }); ScrollTrigger.refresh(); };
    const raf = requestAnimationFrame(refit);
    window.addEventListener('resize', refit);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', refit);
      ctx.revert();
    };
  }, [map, geoOffset]);

  return (
    <section ref={sectionRef} className="journey">
      <div ref={pinRef} className="journey__pin">

        <div ref={mapWrapRef} className="journey__map" aria-hidden="true">
          <MapContainer
            bounds={bounds}
            boundsOptions={{ padding: [20, 20], maxZoom: 7 }}
            zoomControl={false}
            scrollWheelZoom={false}
            attributionControl={false}
            dragging={false}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer url={TILE_BASE} maxZoom={19} detectRetina />
            <TileLayer url={TILE_LABELS} maxZoom={19} detectRetina ref={labelsRef} />
            <MapBridge onReady={setMap} />
          </MapContainer>
        </div>

        <div ref={headRef} className="journey__head">
          <h2 className="journey__title">The Journey</h2>
          <p className="journey__hint">
            {cities.length} cities · {FRAMES.length} frames · select any to open it
          </p>
        </div>

        {/* The sheet. Resting position of every frame is its own grid cell —
            GSAP only ever transforms away from here and back. */}
        <div className="journey__sheet">
          <ul
            ref={gridRef}
            className="journey__grid"
            style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}
          >
            {FRAMES.map((city, i) => (
              <li key={city.slug} className="journey__cellwrap">
                <button
                  ref={(el) => (cellRefs.current[i] = el)}
                  className="journey__cell"
                  onClick={() => setLbIndex(i)}
                  // Names the pin on hover while it is still a dot — the
                  // clusters make it otherwise impossible to tell which is which.
                  title={`${city.name}, ${city.country}`}
                >
                  <span className="journey__glyph" aria-hidden="true" />
                  <img
                    className="journey__photo"
                    src={thumbSrc(city.heroImage)}
                    alt={`${city.name}, ${city.country}`}
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />
                  <span className="journey__label">{city.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Enlarged selects */}
        <div className="journey__stage" aria-hidden="true">
          {selectedIdx.map((p, n) => (
            <figure
              key={FRAMES[p].slug}
              ref={(el) => (stageRefs.current[n] = el)}
              className="journey__frame"
            >
              <img src={FRAMES[p].heroImage} alt="" draggable="false" />
              <ExifCard photo={FRAMES[p].heroImage} compact className="journey__frame-exif" />
            </figure>
          ))}
        </div>

        <a ref={outroRef} className="journey__cta" href="/gallery">
          See all {cities.reduce((n, c) => n + c.photos.length, 0)} photographs
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
