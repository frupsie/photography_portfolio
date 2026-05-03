import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cities } from '../../data/cities';

const countries = [...new Set(cities.map(c => c.country))];

// Build a flat photo list from every city
function buildPhotoList() {
  const list = [];
  cities.forEach(city => {
    if (city.heroImage && !city.heroImage.includes('placeholder')) {
      list.push({ src: city.heroImage, city: city.name, country: city.country, slug: city.slug });
    }
    city.photos.forEach(src => {
      list.push({ src, city: city.name, country: city.country, slug: city.slug });
    });
  });
  return list;
}

const ALL_PHOTOS = buildPhotoList();

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return ALL_PHOTOS;
    // Match on country or city name
    return ALL_PHOTOS.filter(
      p => p.country === activeFilter || p.city === activeFilter
    );
  }, [activeFilter]);

  const isEmpty = filtered.length === 0;

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

      {/* Filter nav */}
      <div className="gallery-filter">
        <div className="gallery-filter__inner">
          {/* All */}
          <FilterPill
            label="All"
            active={activeFilter === 'All'}
            onClick={() => setActiveFilter('All')}
          />

          <span className="gallery-filter__divider" />

          {/* Countries */}
          {countries.map(country => (
            <FilterPill
              key={country}
              label={country}
              active={activeFilter === country}
              onClick={() => setActiveFilter(country)}
            />
          ))}

          <span className="gallery-filter__divider" />

          {/* Cities */}
          {cities.map(city => (
            <FilterPill
              key={city.slug}
              label={city.name}
              active={activeFilter === city.name}
              onClick={() => setActiveFilter(city.name)}
            />
          ))}
        </div>
      </div>

      {/* Photo grid */}
      {isEmpty ? (
        <div className="gallery-empty">
          <p>No photos yet for <strong>{activeFilter}</strong> — check back soon.</p>
        </div>
      ) : (
        <motion.div className="gallery-grid" layout>
          <AnimatePresence>
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.src + i}
                className="gallery-item"
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
              >
                <img src={photo.src} alt={`${photo.city}`} loading="lazy" />
                <div className="gallery-item__overlay">
                  <span className="gallery-item__city">{photo.city}</span>
                  <span className="gallery-item__country">{photo.country}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      className={`gallery-filter__pill${active ? ' gallery-filter__pill--active' : ''}`}
      onClick={onClick}
    >
      {label}
      {active && (
        <motion.span
          className="gallery-filter__pill-bar"
          layoutId="filter-bar"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
