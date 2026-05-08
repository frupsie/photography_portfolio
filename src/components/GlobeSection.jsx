/**
 * MapSection — 2D interactive map (Google Maps style) with country zoom.
 * Libraries: Leaflet + react-leaflet, CartoDB Voyager tiles (free, no key).
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
function makePinIcon(dimmed) {
  return L.divIcon({
    className: '',
    html: `<div class="map-pin${dimmed ? ' map-pin--dim' : ''}">
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
function MapController({ bounds, defaultView }) {
  const map     = useMap();
  const prevRef = useRef(null);

  // Permanently disable scroll-wheel zoom so page scrolling is never hijacked
  useEffect(() => {
    map.scrollWheelZoom.disable();
  }, [map]);

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

// ─── Section wrapper (exported) ───────────────────────────────────────────────
export default function GlobeSection() {
  const navigate = useNavigate();
  const [activeCountry, setActiveCountry] = useState(null);
  const [activeBounds,  setActiveBounds]  = useState(null);

  function handleTabClick(country) {
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

  return (
    <section className="globe-section">
      <div className="globe-section__header">
        <h2 className="globe-section__heading">Where I've Been</h2>
        <p className="globe-section__sub">
          {cities.length} cities · 3 countries · across Asia
        </p>
      </div>

      <div className="globe-canvas-wrapper">
        <MapContainer
          center={ASIA_VIEW.center}
          zoom={ASIA_VIEW.zoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          <ZoomControl position="topright" />
          <MapController bounds={activeBounds} defaultView={ASIA_VIEW} />

          {cities.map((city) => {
            const focused  = activeCountry !== null;
            const isActive = !focused || (COUNTRY_SLUGS[activeCountry]?.includes(city.slug) ?? false);
            const dimmed   = focused && !isActive;
            const icon     = makePinIcon(dimmed);

            return (
              <Marker
                key={city.slug}
                position={[city.lat, city.lon]}
                icon={icon}
                eventHandlers={{
                  click: () => navigate('/gallery', { state: { country: city.name } }),
                }}
              >
                {focused && isActive ? (
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

      <p className="globe-section__hint">{hintText}</p>

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
    </section>
  );
}
