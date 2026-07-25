import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cities } from '../../data/cities';
import { thumbSrc } from '../../utils/thumb';
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

// Photo counts — computed once at module load
const COUNT_BY_COUNTRY = {};
const COUNT_BY_CITY    = {};
ALL_PHOTOS.forEach(p => {
  COUNT_BY_COUNTRY[p.country] = (COUNT_BY_COUNTRY[p.country] || 0) + 1;
  COUNT_BY_CITY[p.city]       = (COUNT_BY_CITY[p.city]       || 0) + 1;
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const location = useLocation();

  // Two-level selection: country → city
  const [selCountry, setSelCountry] = useState(() => location.state?.country ?? null);
  const [selCity,    setSelCity]    = useState(null);

  const [lightboxIndex, setLightboxIndex] = useState(null);

  // ── Navigation helpers ──────────────────────────────────────────────────────

  const clearAll      = () => { setSelCountry(null); setSelCity(null); };
  const selectCountry = (c) => { setSelCountry(c); setSelCity(null); };
  const selectCity    = (name) => setSelCity(name);

  // ── Derived state ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (selCity)    return ALL_PHOTOS.filter(p => p.city === selCity);
    if (selCountry) return ALL_PHOTOS.filter(p => p.country === selCountry);
    return ALL_PHOTOS;
  }, [selCity, selCountry]);

  const activeCities = useMemo(
    () => selCountry ? cities.filter(c => c.country === selCountry) : [],
    [selCountry],
  );

  // Tally text — right side of filter bar
  const tallyText = useMemo(() => {
    if (selCity) {
      const cityCount    = COUNT_BY_CITY[selCity]       ?? 0;
      const countryTotal = COUNT_BY_COUNTRY[selCountry] ?? 0;
      return `${cityCount} / ${countryTotal}`;
    }
    if (selCountry) return `${COUNT_BY_COUNTRY[selCountry] ?? 0} photos`;
    return `${ALL_PHOTOS.length} photos`;
  }, [selCity, selCountry]);

  const activeLabel = selCity ?? selCountry ?? 'All';
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

        {/* Row 1 — All + Countries + tally (always visible, full width) */}
        <div className="gallery-filter__row gallery-filter__row--main">
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

          {/* Tally — floated to the right */}
          <AnimatePresence mode="wait">
            <motion.span
              key={tallyText}
              className="gallery-filter__tally"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {tallyText}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Row 2 — Cities (shown when a country is selected) */}
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
        <div className="gallery-grid">
          <AnimatePresence>
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.src}
                className={`gallery-item gallery-item--${photo.orientation ?? 'landscape'}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
                onClick={() => setLightboxIndex(i)}
              >
                {/* Grid shows the 800px WebP thumbnail; the lightbox loads
                    the full photos-web version on demand. */}
                <img src={thumbSrc(photo.src)} alt={photo.city} loading="lazy" decoding="async" />
                <div className="gallery-item__overlay">
                  <span className="gallery-item__city">{photo.city}</span>
                  <span className="gallery-item__country">{photo.country}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
