/**
 * FlightMap — animated 2D Leaflet map for the Featured page.
 *
 * Phase 1: planes fly from Singapore to hub cities (HK, Seoul, Hainan,
 *          Guangzhou, Tokyo), staggered.
 * Phase 2: trains/cars branch out from each hub to its satellite cities
 *          (Guangzhou → SZ/Macau, Tokyo → Nikko/Hakone/Kyoto/Osaka).
 *
 * Implementation notes:
 * - Curved arcs computed as quadratic beziers in lat/lon space.
 * - Each route owns a `L.polyline` (grows as the vehicle moves) plus a
 *   `L.marker` with a rotating DivIcon for the plane/train/car SVG.
 * - All animations use requestAnimationFrame; no GSAP / Framer for the
 *   map (kept lean — Leaflet does the heavy lifting).
 * - Reduced-motion: skips animation, draws all routes + lights all pins.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { cities, SINGAPORE } from '../data/cities';
import { journeyRoutes, FLIGHT_TIMINGS } from '../data/journey';
import 'leaflet/dist/leaflet.css';

const ASIA_VIEW = { center: [22, 116], zoom: 4 };

// Build a quick lookup: slug → city object (plus SIN special case)
const cityBySlug = new Map(cities.map((c) => [c.slug, c]));
function pointFor(slug) {
  if (slug === 'SIN') return { lat: SINGAPORE.lat, lon: SINGAPORE.lon, name: 'Singapore', country: 'Singapore' };
  return cityBySlug.get(slug);
}

// Quadratic bezier in lat/lon — gives a satisfying arc that bows away from
// the straight chord. Offset proportional to distance + perpendicular.
function curveBetween(from, to, samples = 64) {
  const dx = to.lon - from.lon;
  const dy = to.lat - from.lat;
  // Control point perpendicular to chord; sign chosen so arcs bow "outward"
  const cx = (from.lon + to.lon) / 2 + dy * 0.18;
  const cy = (from.lat + to.lat) / 2 - dx * 0.18;
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples;
    const u = 1 - t;
    return [
      u * u * from.lat + 2 * u * t * cy + t * t * to.lat,
      u * u * from.lon + 2 * u * t * cx + t * t * to.lon,
    ];
  });
}

// SVG icons — kept inline so we can tint via fill on a single source of truth.
const ICON_SVG = {
  plane: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  train: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>`,
  car:   `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-8l-2.08-5.99zM6.5 16a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
};

function vehicleIcon(mode, angleDeg) {
  return L.divIcon({
    className: 'flight-map__vehicle',
    html: `<span style="display:inline-block;transform:rotate(${angleDeg}deg);color:#7a4d18;">${ICON_SVG[mode] ?? ICON_SVG.plane}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// Golf-tee pin (matches the original GlobeSection): head + shaft + tip.
// `lit` brings the pin to full opacity; `origin` marks Singapore (slightly
// larger, no shaft — it sits on the ground rather than landing from above).
function pinIcon({ lit = false, origin = false } = {}) {
  if (origin) {
    return L.divIcon({
      className: '',
      html: `<div class="map-pin map-pin--origin"><div class="map-pin__head"></div></div>`,
      iconSize:      [18, 18],
      iconAnchor:    [9, 9],
      tooltipAnchor: [10, -10],
    });
  }
  const classes = ['map-pin', 'map-pin--flight'];
  if (!lit) classes.push('map-pin--dim');
  return L.divIcon({
    className: '',
    html: `<div class="${classes.join(' ')}">
             <div class="map-pin__head"></div>
             <div class="map-pin__shaft"></div>
             <div class="map-pin__tip"></div>
           </div>`,
    iconSize:      [16, 32],
    iconAnchor:    [8, 32],
    tooltipAnchor: [10, -22],
  });
}

// Inner map child — has access to the `map` instance via useMap()
function FlightLayer({ onComplete }) {
  const map = useMap();
  const cleanupRef = useRef({ layers: [], frames: [], timeouts: [], vehicles: [] });
  const [animationKey, setAnimationKey] = useState(0); // bump to replay

  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Build pin markers (all cities + Singapore origin). Stored once.
  const pinsRef = useRef({});
  useEffect(() => {
    const created = {};
    // Singapore origin — always lit, with a permanent label so the viewer
    // immediately knows where the journey begins.
    const sin = pointFor('SIN');
    created.SIN = L.marker([sin.lat, sin.lon], {
      icon: pinIcon({ lit: true, origin: true }),
      interactive: false,
      keyboard: false,
    }).addTo(map);
    created.SIN.bindTooltip('SINGAPORE', {
      direction: 'right',
      offset: [12, 0],
      permanent: true,
      className: 'map-tooltip map-tooltip--origin',
    });

    cities.forEach((c) => {
      if (!c.lat || !c.lon) return;
      const m = L.marker([c.lat, c.lon], {
        icon: pinIcon({ lit: reduced }),
      }).addTo(map);
      m.bindTooltip(
        `<span class="map-tooltip__city">${c.name}</span><span class="map-tooltip__country">${c.country}</span>`,
        { direction: 'top', offset: [0, -28], className: 'map-tooltip' }
      );
      m.on('click', () => {
        // City pages live at /city/:slug
        window.location.href = `/city/${c.slug}`;
      });
      created[c.slug] = m;
    });
    pinsRef.current = created;
    return () => {
      Object.values(created).forEach((m) => m.remove());
    };
  }, [map, reduced]);

  // Animate a single route from `from` slug to `to` slug, calling `done`
  // when the vehicle arrives.
  const animateRoute = useCallback((route, duration, done) => {
    const from = pointFor(route.from);
    const to   = pointFor(route.to);
    if (!from || !to) { done?.(); return; }

    const pts = curveBetween(from, to, 64);
    const isAir = route.mode === 'plane';
    // Voyager tiles are light beige; use a deeper, more saturated gold so
    // arcs read clearly against landmasses and sea.
    const color = isAir ? '#a8722e' : '#b88a3c';
    const trail = L.polyline([pts[0]], {
      color,
      weight: isAir ? 2 : 1.6,
      opacity: 1,
      dashArray: isAir ? null : '6 5',
      smoothFactor: 1,
      interactive: false,
    }).addTo(map);

    // Initial vehicle heading (point 0 → 1)
    const initialAngle = bearing(pts[0], pts[1]);
    const vehicle = L.marker(pts[0], {
      icon: vehicleIcon(route.mode, initialAngle),
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
    }).addTo(map);

    cleanupRef.current.layers.push(trail, vehicle);
    cleanupRef.current.vehicles.push(vehicle);

    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease-in-out cubic for natural plane motion
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const idx = Math.min(pts.length - 1, Math.floor(e * (pts.length - 1)));
      // Extend trail
      trail.setLatLngs(pts.slice(0, idx + 1));
      // Move vehicle + rotate to face next point
      vehicle.setLatLng(pts[idx]);
      const next = pts[Math.min(pts.length - 1, idx + 1)];
      const ang = bearing(pts[idx], next);
      vehicle.setIcon(vehicleIcon(route.mode, ang));

      if (t < 1) {
        const id = requestAnimationFrame(tick);
        cleanupRef.current.frames.push(id);
      } else {
        // Vehicle disappears on arrival; trail stays
        try { vehicle.remove(); } catch { /* already removed */ }
        done?.();
      }
    };
    const id = requestAnimationFrame(tick);
    cleanupRef.current.frames.push(id);
  }, [map]);

  // Light up a destination pin
  const lightUpPin = useCallback((slug) => {
    const m = pinsRef.current[slug];
    if (m) m.setIcon(pinIcon({ lit: true }));
  }, []);

  // Main choreography
  useEffect(() => {
    // Cleanup from previous run (replay)
    cleanupRef.current.frames.forEach((id) => cancelAnimationFrame(id));
    cleanupRef.current.timeouts.forEach((id) => clearTimeout(id));
    cleanupRef.current.layers.forEach((l) => l.remove());
    cleanupRef.current = { layers: [], frames: [], timeouts: [], vehicles: [] };

    // Reset all pins to unlit (except Singapore origin)
    Object.entries(pinsRef.current).forEach(([slug, m]) => {
      if (slug === 'SIN') return;
      m.setIcon(pinIcon({ lit: reduced }));
    });

    if (reduced) {
      // Draw all routes static; pins already lit
      journeyRoutes.forEach((r) => {
        const from = pointFor(r.from);
        const to   = pointFor(r.to);
        if (!from || !to) return;
        const isAir = r.mode === 'plane';
        const line = L.polyline(curveBetween(from, to, 64), {
          color: isAir ? '#a8722e' : '#b88a3c',
          weight: isAir ? 2 : 1.6,
          dashArray: isAir ? null : '6 5',
          interactive: false,
        }).addTo(map);
        cleanupRef.current.layers.push(line);
      });
      onComplete?.();
      return;
    }

    const phase1 = journeyRoutes.filter((r) => r.phase === 1);
    const phase2 = journeyRoutes.filter((r) => r.phase === 2);

    // ── Phase 1 — planes leave SIN, staggered ──────────────────────
    // Time-based scheduling rather than counter-based: a single missed
    // `done` callback (e.g., cancelled rAF during StrictMode double-mount)
    // shouldn't stall the entire choreography.
    phase1.forEach((r, i) => {
      const id = setTimeout(() => {
        animateRoute(r, FLIGHT_TIMINGS.PHASE_1_DURATION, () => lightUpPin(r.to));
      }, i * FLIGHT_TIMINGS.PHASE_1_GAP);
      cleanupRef.current.timeouts.push(id);
    });

    // ── Phase 2 — ground vehicles fan out from hubs, after a pause ──
    const phase1TotalTime =
      (phase1.length - 1) * FLIGHT_TIMINGS.PHASE_1_GAP + FLIGHT_TIMINGS.PHASE_1_DURATION;
    const phase2Start = phase1TotalTime + FLIGHT_TIMINGS.PHASE_GAP;
    phase2.forEach((r, j) => {
      const id = setTimeout(() => {
        animateRoute(r, FLIGHT_TIMINGS.PHASE_2_DURATION, () => lightUpPin(r.to));
      }, phase2Start + j * FLIGHT_TIMINGS.PHASE_2_GAP);
      cleanupRef.current.timeouts.push(id);
    });

    // ── Completion: fire after the very last vehicle arrives ────────
    const phase2TotalTime =
      (phase2.length - 1) * FLIGHT_TIMINGS.PHASE_2_GAP + FLIGHT_TIMINGS.PHASE_2_DURATION;
    const totalTime = phase2Start + phase2TotalTime + 200; // small buffer
    const completeId = setTimeout(() => {
      // Defensive sweep: any vehicle whose rAF didn't reach t>=1 still lingers.
      // Light up its destination pin (in case lightUpPin was missed) and remove.
      cleanupRef.current.vehicles.forEach((v) => {
        try { v.remove(); } catch { /* already removed */ }
      });
      cleanupRef.current.vehicles = [];
      // Ensure every destination is lit
      journeyRoutes.forEach((r) => lightUpPin(r.to));
      onComplete?.();
    }, totalTime);
    cleanupRef.current.timeouts.push(completeId);

    return () => {
      cleanupRef.current.frames.forEach((id) => cancelAnimationFrame(id));
      cleanupRef.current.timeouts.forEach((id) => clearTimeout(id));
      cleanupRef.current.layers.forEach((l) => l.remove());
    };
  }, [animationKey, map, reduced, animateRoute, lightUpPin, onComplete]);

  // Expose a replay function via window event (so the parent button can call it)
  useEffect(() => {
    const handler = () => setAnimationKey((k) => k + 1);
    window.addEventListener('flightmap:replay', handler);
    return () => window.removeEventListener('flightmap:replay', handler);
  }, []);

  return null;
}

// Compute heading angle (degrees) from point A → B, where point = [lat, lon].
// 0° = up (north), 90° = east. Used to rotate vehicle SVGs.
function bearing(a, b) {
  // Map x = lon, y = lat in screen-ish space (we ignore great-circle nicety
  // — at this zoom the icon rotation is purely cosmetic).
  const dx = b[1] - a[1];
  const dy = b[0] - a[0];
  return Math.atan2(dx, dy) * (180 / Math.PI);
}

export default function FlightMap() {
  const [complete, setComplete] = useState(false);

  // Stable reference — without useCallback, every render passes a fresh fn
  // to FlightLayer, retriggering its useEffect and restarting the animation
  // in a tight loop once Phase 2 finishes.
  const handleComplete = useCallback(() => setComplete(true), []);

  const handleReplay = useCallback(() => {
    setComplete(false);
    window.dispatchEvent(new Event('flightmap:replay'));
  }, []);

  return (
    <div className="flight-map">
      <MapContainer
        center={ASIA_VIEW.center}
        zoom={ASIA_VIEW.zoom}
        zoomControl={false}
        dragging={true}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        className="flight-map__inner"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <FlightLayer onComplete={handleComplete} />
      </MapContainer>

      <button
        className={`flight-map__replay${complete ? '' : ' flight-map__replay--hidden'}`}
        onClick={handleReplay}
        aria-label="Replay journey"
      >
        ↻ Replay
      </button>
    </div>
  );
}
