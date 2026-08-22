/**
 * GlobeSectionV2 — staged variant of GlobeSection.
 *
 * Two changes over the live component, both about the pins:
 *
 *   1. Passive mode can now carry interaction. The live version ties "no chrome"
 *      and "no clicks" together in the single `passive` flag, so Act 2's map is
 *      decorative by construction. Chrome and interaction are separate concerns,
 *      so this splits them: `interactivePins` re-enables clicks, tooltips and
 *      keyboard focus while the header, tabs and hint stay hidden.
 *
 *   2. The pin is restyled and given a real hit target — see .map-pin--v2.
 *
 * Live GlobeSection.jsx is untouched. Viewable at /sandbox/act2.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cities } from '../../data/cities';

// Derived from cities.js — never hand-maintained. See CLAUDE.md.
const COUNTRY_SLUGS = cities.reduce((acc, c) => {
  (acc[c.country] ??= []).push(c.slug);
  return acc;
}, {});

const ASIA_VIEW = { center: [29, 118], zoom: 4 };

function countryBounds(country) {
  const slugs = COUNTRY_SLUGS[country];
  const countryCities = cities.filter((c) => slugs.includes(c.slug));
  const lats = countryCities.map((c) => c.lat);
  const lons = countryCities.map((c) => c.lon);
  const latPad = Math.max((Math.max(...lats) - Math.min(...lats)) * 0.25, 0.4);
  const lonPad = Math.max((Math.max(...lons) - Math.min(...lons)) * 0.25, 0.4);
  return L.latLngBounds(
    [Math.min(...lats) - latPad, Math.min(...lons) - lonPad],
    [Math.max(...lats) + latPad, Math.max(...lons) + lonPad],
  );
}

// How many published frames a city carries — shown in the tooltip so the pin
// says what is behind it, not just where it is.
function frameCount(city) {
  const seen = new Set();
  if (city.heroImage && !city.heroImage.includes('placeholder')) seen.add(city.heroImage);
  (city.photos ?? []).forEach((p) => seen.add(typeof p === 'string' ? p : p.src));
  return seen.size;
}

// The taller icon box (16x38 vs the live 16x32) is the pin plus its ground
// shadow; the anchor still sits on the shadow's centre so the point lands on
// the true coordinate.
// Icons are cached by identity. react-leaflet calls marker.setIcon() whenever
// the `icon` prop is a different object, and Leaflet's setIcon replaces the
// marker's DOM element outright — so returning a fresh icon each render tore
// every pin down and restarted its drop animation on every scroll tick.
const ICON_CACHE = new Map();

function makePinIcon(slug, dimmed, drop = false) {
  const cacheKey = `${slug}:${dimmed}:${drop}`;
  const hit = ICON_CACHE.get(cacheKey);
  if (hit) return hit;
  const classes = ['map-pin', 'map-pin--v2'];
  if (dimmed) classes.push('map-pin--dim');
  if (drop) classes.push('map-pin--drop');
  const icon = L.divIcon({
    className: '',
    html: `<div class="${classes.join(' ')}" data-slug="${slug}">
             <div class="map-pin__head"></div>
             <div class="map-pin__shaft"></div>
             <div class="map-pin__ground"></div>
           </div>`,
    iconSize: [16, 38],
    iconAnchor: [8, 34],
    tooltipAnchor: [0, -30],
  });
  ICON_CACHE.set(cacheKey, icon);
  return icon;
}

/**
 * Decluster — fans overlapping pins apart so each one can be hit.
 *
 * At the Asia-wide default zoom the cities genuinely collide: Shenzhen and Hong
 * Kong land 2.2px apart, and 10 of 13 pins sit closer to a neighbour than half
 * a usable target. That is not a hit-area problem — the 12px heads themselves
 * overlap — so no amount of padding fixes it. The pins have to move.
 *
 * Members of a colliding group are pushed onto a small circle around the
 * group's centroid. Displacement is capped at FAN_RADIUS so a pin never drifts
 * far from its true coordinate, and the offset is written as a CSS variable
 * rather than a transform so the hover lift can compose with it.
 */
const COLLIDE_PX = 20;
const FAN_RADIUS = 17;

function Decluster({ cities: list, markers }) {
  const map = useMap();
  // Depend on the slug list, not the array: `cities` is a fresh array on every
  // scroll tick, which would restart this effect continuously.
  const key = list.map((c) => c.slug).join(',');

  useEffect(() => {
    if (!map) return;

    const apply = () => {
      const pts = list.map((c) => ({
        slug: c.slug,
        ll: [c.lat, c.lon],
        p: map.latLngToContainerPoint([c.lat, c.lon]),
      }));

      // Greedy single-link grouping; n is 13, so the naive pass is fine.
      const seen = new Set();
      const groups = [];
      for (const a of pts) {
        if (seen.has(a.slug)) continue;
        const g = [a];
        seen.add(a.slug);
        for (const b of pts) {
          if (seen.has(b.slug)) continue;
          if (g.some((m) => m.p.distanceTo(b.p) < COLLIDE_PX)) {
            g.push(b);
            seen.add(b.slug);
          }
        }
        groups.push(g);
      }

      for (const g of groups) {
        const cx = g.reduce((t, m) => t + m.p.x, 0) / g.length;
        const cy = g.reduce((t, m) => t + m.p.y, 0) / g.length;
        const r = FAN_RADIUS * (g.length > 4 ? 1.35 : 1);

        g.forEach((m, i) => {
          const marker = markers.current[m.slug];
          if (!marker) return;
          const el = marker.getElement()?.querySelector('.map-pin--v2');

          if (g.length === 1) {
            // Always reset from the city's true coordinate, never from where
            // the marker currently sits, or repeated passes compound the drift.
            marker.setLatLng(m.ll);
            el?.classList.remove('map-pin--fanned');
            return;
          }

          // Start at 12 o'clock so a pair separates vertically, which reads
          // more clearly than a horizontal pair on a coastline.
          const angle = -Math.PI / 2 + (i / g.length) * Math.PI * 2;
          const fx = cx + Math.cos(angle) * r - m.p.x;
          const fy = cy + Math.sin(angle) * r - m.p.y;

          // Move the marker rather than transforming its icon: Leaflet then
          // positions the tooltip correctly on its own, and nothing has to be
          // rebuilt. Rebuilding the icon is what made the pins flicker and
          // restart their drop animation on every scroll tick.
          marker.setLatLng(map.containerPointToLatLng(L.point(m.p.x + fx, m.p.y + fy)));

          if (el) {
            el.classList.add('map-pin--fanned');
            el.style.setProperty('--fan-dist', `${Math.hypot(fx, fy).toFixed(1)}px`);
            // Leader angle is computed here rather than in CSS: atan2()/sqrt()
            // as CSS functions are recent additions with uneven support.
            el.style.setProperty('--fan-lead', `${((Math.atan2(-fx, -fy) * 180) / Math.PI).toFixed(1)}deg`);
          }
        });
      }
    };

    // Markers are added by their own effects, which run after this one.
    const raf = requestAnimationFrame(apply);
    map.on('zoomend resize', apply);
    return () => {
      cancelAnimationFrame(raf);
      map.off('zoomend resize', apply);
    };
  }, [map, key]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function MapController({ bounds, defaultView, interactive }) {
  const map = useMap();
  const prevRef = useRef(null);

  useEffect(() => {
    map.scrollWheelZoom.disable();
    if (!interactive) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    }
  }, [map, interactive]);

  useEffect(() => {
    if (bounds === prevRef.current) return;
    prevRef.current = bounds;
    if (bounds) {
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 11, duration: 1.4 });
    } else {
      map.flyTo(defaultView.center, defaultView.zoom, { duration: 1.4 });
    }
  }, [bounds, map, defaultView]);

  return null;
}

export default function GlobeSectionV2({
  mode = 'interactive',
  visibleSlugs = null,
  // Lets a passive map keep clickable, focusable, tooltipped pins.
  interactivePins = false,
} = {}) {
  const navigate = useNavigate();
  const markerRefs = useRef({});
  const passive = mode === 'passive';
  const pinsLive = !passive || interactivePins;
  const [activeCountry, setActiveCountry] = useState(null);
  const [activeBounds, setActiveBounds] = useState(null);

  function handleTabClick(country) {
    if (passive) return;
    if (activeCountry === country) {
      setActiveCountry(null);
      setActiveBounds(null);
    } else {
      setActiveCountry(country);
      setActiveBounds(countryBounds(country));
    }
  }

  const visibleCities = passive && visibleSlugs
    ? cities.filter((c) => visibleSlugs.has(c.slug))
    : cities;

  return (
    <section className={`globe-section${passive ? ' globe-section--passive' : ''}`}>
      {!passive && (
        <div className="globe-section__header">
          <h2 className="globe-section__heading">Where I've Been</h2>
          <p className="globe-section__sub">{cities.length} cities · 3 countries · across Asia</p>
        </div>
      )}

      <div className="globe-canvas-wrapper">
        <MapContainer
          center={ASIA_VIEW.center}
          zoom={ASIA_VIEW.zoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
          attributionControl={false}
          dragging={!passive}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
            detectRetina
          />

          {!passive && <ZoomControl position="topright" />}
          <MapController bounds={activeBounds} defaultView={ASIA_VIEW} interactive={!passive} />
          {pinsLive && <Decluster cities={visibleCities} markers={markerRefs} />}

          {visibleCities.map((city) => {
            const focused = activeCountry !== null;
            const isActive = !focused || (COUNTRY_SLUGS[activeCountry]?.includes(city.slug) ?? false);
            const dimmed = focused && !isActive;
            const frames = frameCount(city);

            return (
              <Marker
                key={city.slug}
                ref={(m) => {
                  if (m) markerRefs.current[city.slug] = m;
                  else delete markerRefs.current[city.slug];
                }}
                position={[city.lat, city.lon]}
                icon={makePinIcon(city.slug, dimmed, passive)}
                // Overlapping pins (Guangzhou/Shenzhen/Dongguan sit within a few
                // px at the default zoom) — hovering lifts one clear of the others.
                riseOnHover
                keyboard={pinsLive}
                // `title`, not `alt`: Leaflet only writes alt onto <img> icons,
                // so a DivIcon marker given alt is tabbable with no accessible
                // name at all. title lands on the element either way.
                title={`${city.name}, ${city.country} — ${frames} ${frames === 1 ? 'frame' : 'frames'}`}
                eventHandlers={
                  pinsLive
                    ? { click: () => navigate(`/city/${city.slug}`) }
                    : {}
                }
              >
                {pinsLive && (
                  <Tooltip
                    permanent={focused && isActive}
                    direction="top"
                    className={`map-tooltip${focused && isActive ? ' map-tooltip--permanent' : ''}`}
                  >
                    <span className="map-tooltip__city">{city.name}</span>
                    <span className="map-tooltip__country">
                      {city.country}
                      {frames > 0 && ` · ${frames} ${frames === 1 ? 'frame' : 'frames'}`}
                    </span>
                  </Tooltip>
                )}
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {!passive && (
        <p className="globe-section__hint">
          {activeCountry ? 'Click the active tab to reset view' : 'Drag to pan · Click a pin to explore'}
        </p>
      )}

      {!passive && (
        <div className="globe-tabs">
          {Object.keys(COUNTRY_SLUGS).map((country) => (
            <button
              key={country}
              className={`globe-tab${activeCountry === country ? ' globe-tab--active' : ''}`}
              onClick={() => handleTabClick(country)}
            >
              {country}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
