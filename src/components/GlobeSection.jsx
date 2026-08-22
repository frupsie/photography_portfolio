/**
 * GlobeSection — 2D interactive map (Leaflet) with country zoom.
 *
 * Modes:
 *   "interactive" (default) — header, country tabs, hint, clickable pins.
 *   "passive"               — chrome hidden, clicks disabled, pins controlled
 *                             externally via `visibleSlugs` (Set of city slugs).
 *
 * Currently used by Reel Act 2 "The Journey" (passive mode). The interactive
 * mode is still supported but has no caller since /featured was retired.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cities } from '../data/cities';

// ─── Which city slugs belong to each country ──────────────────────────────────
const COUNTRY_SLUGS = {
  China:         ['hainan', 'guangzhou', 'shenzhen', 'hong-kong', 'macau'],
  Japan:         ['tokyo', 'osaka', 'kyoto', 'hakone', 'nikko'],
  'South Korea': ['seoul'],
};

// ─── Compute LatLngBounds framing a set of cities ─────────────────────────────
function boundsFor(cityList, padFactor = 0.25) {
  const lats = cityList.map(c => c.lat);
  const lons = cityList.map(c => c.lon);
  const latPad = Math.max((Math.max(...lats) - Math.min(...lats)) * padFactor, 0.4);
  const lonPad = Math.max((Math.max(...lons) - Math.min(...lons)) * padFactor, 0.4);
  return L.latLngBounds(
    [Math.min(...lats) - latPad, Math.min(...lons) - lonPad],
    [Math.max(...lats) + latPad, Math.max(...lons) + lonPad],
  );
}

// The default view frames the cities that actually exist rather than a fixed
// centre and zoom. The old hardcoded [29, 118] sat ~7 degrees west of the real
// centre of the collection, wasting the frame on inland China and pushing Japan
// against the right edge. Deriving it also means the map reframes itself when
// a city is added instead of quietly drifting off-centre.
//
// Handing bounds to Leaflet (rather than a zoom number) lets it pick the zoom
// that fits the actual container, so the framing holds on any screen size.
const COLLECTION_BOUNDS = boundsFor(cities, 0.12);

const countryBounds = (country) =>
  boundsFor(cities.filter(c => COUNTRY_SLUGS[country].includes(c.slug)));

// ─── Custom gold map-pin DivIcon ──────────────────────────────────────────────
// `drop` enables the CSS drop-in animation (used in passive/reveal mode).
function makePinIcon(dimmed, drop = false) {
  const classes = ['map-pin'];
  if (dimmed) classes.push('map-pin--dim');
  if (drop)   classes.push('map-pin--drop');
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

const DEFAULT_FIT = { padding: [24, 24], maxZoom: 8 };
const COUNTRY_FIT = { padding: [60, 60], maxZoom: 11 };

// ─── Map controller: disables scroll zoom, animates to bounds/view ────────────
function MapController({ bounds, defaultBounds, interactive }) {
  const map     = useMap();
  const prevRef = useRef(null);
  // Kept in a ref so the ResizeObserver below always refits to the CURRENT
  // target without needing to be torn down and rebuilt on every bounds change.
  const targetRef = useRef(bounds ?? defaultBounds);
  targetRef.current = bounds ?? defaultBounds;

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

  // Re-fit whenever the container's size changes.
  //
  // This map is lazy-loaded inside a sticky, GSAP-pinned section, so Leaflet's
  // initial fitBounds can run before the pin has its final layout — it was
  // measuring the container as ~434px when it is really ~1096px, leaving the
  // map roughly 2.5x too far out. Leaflet's own resize handling calls
  // invalidateSize(), which refreshes dimensions but PRESERVES zoom, so the bad
  // fit was never corrected. Refitting explicitly is what actually fixes it.
  useEffect(() => {
    const el = map.getContainer();
    let timer;

    const refit = () => {
      map.invalidateSize({ animate: false });
      const target = targetRef.current;
      if (target) {
        // animate:false — this is a correction, not a journey. Flying on every
        // resize tick would look like a glitch.
        map.fitBounds(target, {
          ...(target === defaultBounds ? DEFAULT_FIT : COUNTRY_FIT),
          animate: false,
        });
      }
    };

    // Trailing debounce: a ResizeObserver can fire rapidly while the pinned
    // section animates, and refitting mid-animation is wasted work.
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(refit, 120);
    });
    observer.observe(el);

    // Guard for the case where the pin settles without the map's own box
    // changing size, which the observer would never see.
    const raf = requestAnimationFrame(refit);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [map, defaultBounds]);

  useEffect(() => {
    if (bounds === prevRef.current) return;
    prevRef.current = bounds;
    if (bounds) {
      map.flyToBounds(bounds, { ...COUNTRY_FIT, duration: 1.4 });
    } else {
      // Back to the whole collection, framed to the container rather than a
      // fixed zoom that would be wrong on a different screen size.
      map.flyToBounds(defaultBounds, { ...DEFAULT_FIT, duration: 1.4 });
    }
  }, [bounds, map, defaultBounds]);

  return null;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
export default function GlobeSection({
  mode          = 'interactive',
  visibleSlugs  = null,
} = {}) {
  const navigate = useNavigate();
  const passive  = mode === 'passive';
  const [activeCountry, setActiveCountry] = useState(null);
  const [activeBounds,  setActiveBounds]  = useState(null);

  function handleTabClick(country) {
    if (passive) return;
    const isReset = activeCountry === country;
    if (isReset) {
      setActiveCountry(null);
      setActiveBounds(null);
    } else {
      setActiveCountry(country);
      setActiveBounds(countryBounds(country));
    }
  }

  const hintText = activeCountry
    ? 'Click the active tab to reset view'
    : 'Drag to pan · Click a pin to explore';

  // Filter city list when in passive reveal mode
  const visibleCities = passive && visibleSlugs
    ? cities.filter((c) => visibleSlugs.has(c.slug))
    : cities;

  return (
    <section className={`globe-section${passive ? ' globe-section--passive' : ''}`}>
      {!passive && (
        <div className="globe-section__header">
          <h2 className="globe-section__heading">Where I've Been</h2>
          <p className="globe-section__sub">
            {cities.length} cities · 3 countries · across Asia
          </p>
        </div>
      )}

      <div className="globe-canvas-wrapper">
        <MapContainer
          bounds={COLLECTION_BOUNDS}
          boundsOptions={DEFAULT_FIT}
          // zoomSnap 0 lets fitBounds land on a fractional zoom. With the
          // default snap of 1 it rounds DOWN to the nearest whole level, which
          // was leaving the pins filling only ~47% of the frame — a whole zoom
          // step further out than the bounds actually needed.
          zoomSnap={0}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
          attributionControl={false}
          dragging={!passive}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          {!passive && <ZoomControl position="topright" />}
          <MapController bounds={activeBounds} defaultBounds={COLLECTION_BOUNDS} interactive={!passive} />

          {visibleCities.map((city) => {
            const focused  = activeCountry !== null;
            const isActive = !focused || (COUNTRY_SLUGS[activeCountry]?.includes(city.slug) ?? false);
            const dimmed   = focused && !isActive;
            const icon     = makePinIcon(dimmed, passive);

            return (
              <Marker
                key={city.slug}
                position={[city.lat, city.lon]}
                icon={icon}
                eventHandlers={passive ? {} : {
                  click: () => navigate('/gallery', { state: { country: city.name } }),
                }}
              >
                {passive ? null : focused && isActive ? (
                  <Tooltip permanent direction="top" offset={[0, -28]} className="map-tooltip map-tooltip--permanent">
                    <span className="map-tooltip__city">{city.name}</span>
                    <span className="map-tooltip__country">{city.country}</span>
                  </Tooltip>
                ) : (
                  <Tooltip direction="top" offset={[0, -28]} className="map-tooltip">
                    <span className="map-tooltip__city">{city.name}</span>
                    <span className="map-tooltip__country">{city.country}</span>
                  </Tooltip>
                )}
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {!passive && <p className="globe-section__hint">{hintText}</p>}

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
