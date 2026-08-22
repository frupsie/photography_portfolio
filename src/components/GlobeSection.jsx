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
// Derived from cities.js rather than hand-listed. As a hardcoded object this was
// a second source of truth — adding a city to cities.js without also editing it
// here silently dropped that city from its country's zoom, with nothing to flag
// it. Kamakura had already been lost that way.
const COUNTRY_SLUGS = cities.reduce((acc, c) => {
  (acc[c.country] ??= []).push(c.slug);
  return acc;
}, {});

const ASIA_VIEW = { center: [29, 118], zoom: 4 };

// ─── Compute LatLngBounds that frames every pin in a country ──────────────────
function countryBounds(country) {
  const slugs         = COUNTRY_SLUGS[country];
  const countryCities = cities.filter(c => slugs.includes(c.slug));
  const lats = countryCities.map(c => c.lat);
  const lons = countryCities.map(c => c.lon);
  const latPad = Math.max((Math.max(...lats) - Math.min(...lats)) * 0.25, 0.4);
  const lonPad = Math.max((Math.max(...lons) - Math.min(...lons)) * 0.25, 0.4);
  return L.latLngBounds(
    [Math.min(...lats) - latPad, Math.min(...lons) - lonPad],
    [Math.max(...lats) + latPad, Math.max(...lons) + lonPad],
  );
}

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

// ─── Map controller: disables scroll zoom, animates to bounds/view ────────────
function MapController({ bounds, defaultView, interactive }) {
  const map     = useMap();
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
          center={ASIA_VIEW.center}
          zoom={ASIA_VIEW.zoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
          attributionControl={false}
          dragging={!passive}
        >
          {/* dark_all, not voyager. Voyager is Carto's pale pastel style, and on
              a page whose binding commitment is near-black grounds with muted
              gold it made 20% of the homepage scroll the brightest thing on the
              site — country labels reading louder than the section heading, and
              the eyebrow and heading nearly illegible against it. */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          {!passive && <ZoomControl position="topright" />}
          <MapController bounds={activeBounds} defaultView={ASIA_VIEW} interactive={!passive} />

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
