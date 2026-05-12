import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cities } from '../../data/cities';

const countries = [...new Set(cities.map(c => c.country))];

// Build a flat photo list from every city
function buildPhotoList() {
  const list = [];
  cities.forEach(city => {
    if (city.heroImage && !city.heroImage.includes('placeholder')) {
      list.push({ src: city.heroImage, city: city.name, country: city.country, slug: city.slug, orientation: 'landscape' });
    }
    city.photos.forEach(photo => {
      const src         = typeof photo === 'string' ? photo : photo.src;
      const orientation = typeof photo === 'string' ? 'landscape' : (photo.orientation ?? 'landscape');
      list.push({ src, city: city.name, country: city.country, slug: city.slug, orientation });
    });
  });
  return list;
}

const ALL_PHOTOS = buildPhotoList();

export default function GalleryPage() {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState(
    () => location.state?.country ?? 'All'
  );
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return ALL_PHOTOS;
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
          <FilterPill label="All" active={activeFilter === 'All'} onClick={() => setActiveFilter('All')} />
          <span className="gallery-filter__divider" />
          {countries.map(country => (
            <FilterPill key={country} label={country} active={activeFilter === country} onClick={() => setActiveFilter(country)} />
          ))}
          <span className="gallery-filter__divider" />
          {cities.map(city => (
            <FilterPill key={city.slug} label={city.name} active={activeFilter === city.name} onClick={() => setActiveFilter(city.name)} />
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
          <GalleryLightbox
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

function GalleryLightbox({ photos, index, onClose, onPrev, onNext }) {
  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowLeft')  onPrev();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'Escape')     onClose();
  }, [onPrev, onNext, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const photo = photos[index];

  return (
    <motion.div
      className="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      {/* Close */}
      <button className="lightbox__close" onClick={onClose}>✕</button>

      {/* Counter */}
      <div className="lightbox__counter">
        <span className="lightbox__counter-current">{index + 1}</span>
        <span className="lightbox__counter-sep" />
        <span>{photos.length}</span>
      </div>

      {/* Prev / Next */}
      <button className="lightbox__prev" onClick={e => { e.stopPropagation(); onPrev(); }}>‹</button>
      <button className="lightbox__next" onClick={e => { e.stopPropagation(); onNext(); }}>›</button>

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={photo.src}
          alt={photo.city}
          className={`lightbox__img lightbox__img--${photo.orientation ?? 'landscape'}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          onClick={e => e.stopPropagation()}
        />
      </AnimatePresence>

      {/* Caption */}
      <p className="lightbox__caption">{photo.city} · {photo.country}</p>
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
