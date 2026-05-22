import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cities } from '../../data/cities';
import PhotoLightbox from '../landing/PhotoLightbox';

// ── Derived data ──────────────────────────────────────────────────────────────

const countries = [...new Set(cities.map(c => c.country))];

// Build a flat photo list from every city.
// Deduped by `src`: a hero is often also the first entry in photos[].
function buildPhotoList() {
  const list = [];
  const seen = new Set();
  const push = (src, orientation, city) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    list.push({ src, city: city.name, country: city.country, slug: city.slug, orientation });
  };

  cities.forEach(city => {
    if (city.heroImage && !city.heroImage.includes('placeholder')) {
      push(city.heroImage, 'landscape', city);
    }
    city.photos.forEach(photo => {
      const src         = typeof photo === 'string' ? photo : photo.src;
      const orientation = typeof photo === 'string' ? 'landscape' : (photo.orientation ?? 'landscape');
      push(src, orientation, city);
    });
  });
  return list;
}

const ALL_PHOTOS = buildPhotoList();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Unique regions for a given country, preserving cities.js order. */
function regionsFor(country) {
  const seen = new Set();
  const out  = [];
  cities.forEach(c => {
    if (c.country === country && c.region && !seen.has(c.region)) {
      seen.add(c.region);
      out.push(c.region);
    }
  });
  return out;
}

/** Cities belonging to a region. */
function citiesInRegion(region) {
  return cities.filter(c => c.region === region);
}

/** Cities in a country that have no region assigned. */
function citiesWithoutRegion(country) {
  return cities.filter(c => c.country === country && !c.region);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const location = useLocation();

  // Three-level selection: country → region → city
  const [selCountry, setSelCountry] = useState(() => location.state?.country ?? null);
  const [selRegion,  setSelRegion]  = useState(null);
  const [selCity,    setSelCity]    = useState(null);

  const [lightboxIndex, setLightboxIndex] = useState(null);

  // ── Navigation helpers ──────────────────────────────────────────────────────

  const clearAll = () => { setSelCountry(null); setSelRegion(null); setSelCity(null); };

  const selectCountry = (c) => {
    setSelCountry(c); setSelRegion(null); setSelCity(null);
  };

  const selectRegion = (r) => {
    setSelRegion(r); setSelCity(null);
    // If only 1 city in this region, auto-select it (no third row needed)
    const only = citiesInRegion(r);
    if (only.length === 1) setSelCity(only[0].name);
  };

  const selectCity = (name) => setSelCity(name);

  // ── Derived filter state ────────────────────────────────────────────────────

  // Regions available for the active country (empty = skip region row)
  const activeRegions = useMemo(
    () => selCountry ? regionsFor(selCountry) : [],
    [selCountry],
  );
  const hasRegions = activeRegions.length > 1;

  // Cities to show in the city row:
  // - If a region is selected: cities in that region (unless auto-selected, skipped)
  // - If country has no regions (or only 1): all cities in that country
  const activeCities = useMemo(() => {
    if (!selCountry) return [];
    if (selRegion) {
      const inRegion = citiesInRegion(selRegion);
      // Hide city row when auto-selected (only 1 city, already filtered)
      return inRegion.length > 1 ? inRegion : [];
    }
    // Country has regions but none selected yet → don't show city row yet
    if (hasRegions) return [];
    // Country has no regions → show all its cities directly
    return cities.filter(c => c.country === selCountry);
  }, [selCountry, selRegion, hasRegions]);

  // Photo filter
  const filtered = useMemo(() => {
    if (selCity)    return ALL_PHOTOS.filter(p => p.city === selCity);
    if (selRegion)  return ALL_PHOTOS.filter(p => {
      const c = cities.find(c => c.name === p.city);
      return c?.region === selRegion;
    });
    if (selCountry) return ALL_PHOTOS.filter(p => p.country === selCountry);
    return ALL_PHOTOS;
  }, [selCity, selRegion, selCountry]);

  // Active label for the empty state message
  const activeLabel = selCity ?? selRegion ?? selCountry ?? 'All';
  const isEmpty = filtered.length === 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="gallery-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="gallery-page__header">
        <h1 className="gallery-page__title">Gallery</h1>
        <p className="gallery-page__sub">All photos across Asia</p>
      </div>

      {/* ── Filter nav ── */}
      <div className="gallery-filter">

        {/* Row 1 — All + Countries (always visible) */}
        <div className="gallery-filter__row">
          <FilterPill
            label="All"
            active={!selCountry && !selCity}
            onClick={clearAll}
            levelId="country"
          />
          <span className="gallery-filter__divider" />
          {countries.map(country => (
            <FilterPill
              key={country}
              label={country}
              active={selCountry === country}
              onClick={() => selectCountry(country)}
              levelId="country"
            />
          ))}
        </div>

        {/* Row 2 — Regions (shown when country has multiple regions) */}
        <AnimatePresence>
          {selCountry && hasRegions && (
            <motion.div
              key="region-row"
              className="gallery-filter__row gallery-filter__row--sub"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {activeRegions.map(region => (
                <FilterPill
                  key={region}
                  label={region}
                  active={selRegion === region}
                  onClick={() => selectRegion(region)}
                  levelId="region"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Row 3 — Cities (shown when region is selected or country has no regions) */}
        <AnimatePresence>
          {activeCities.length > 0 && (
            <motion.div
              key="city-row"
              className="gallery-filter__row gallery-filter__row--sub"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {activeCities.map(city => (
                <FilterPill
                  key={city.slug}
                  label={city.name}
                  active={selCity === city.name}
                  onClick={() => selectCity(city.name)}
                  levelId="city"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Photo grid */}
      {isEmpty ? (
        <div className="gallery-empty">
          <p>No photos yet for <strong>{activeLabel}</strong> — check back soon.</p>
        </div>
      ) : (
        <motion.div className="gallery-grid" layout>
          <AnimatePresence>
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.src + i}
                className={`gallery-item gallery-item--${photo.orientation ?? 'landscape'}`}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
                onClick={() => setLightboxIndex(i)}
              >
                <img src={photo.src} alt={photo.city} loading="lazy" />
                <div className="gallery-item__overlay">
                  <span className="gallery-item__city">{photo.city}</span>
                  <span className="gallery-item__country">{photo.country}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={filtered}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={() => setLightboxIndex(i => (i - 1 + filtered.length) % filtered.length)}
            onNext={() => setLightboxIndex(i => (i + 1) % filtered.length)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── FilterPill ────────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick, levelId = 'country' }) {
  return (
    <button
      className={`gallery-filter__pill${active ? ' gallery-filter__pill--active' : ''}`}
      onClick={onClick}
    >
      {label}
      {active && (
        <motion.span
          className="gallery-filter__pill-bar"
          layoutId={`filter-bar-${levelId}`}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
