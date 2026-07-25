import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cities } from '../../data/cities';
import { thumbSrc } from '../../utils/thumb';

export default function CityPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const city = cities.find((c) => c.slug === slug);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!city) {
    return (
      <div className="page-error">
        <h2>City not found</h2>
        <button onClick={() => navigate('/')}>← Home</button>
      </div>
    );
  }

  const hasPhotos = city.photos.length > 0;

  // Detect portrait hero so we can use contain instead of cover
  const heroOrientation = city.photos.find((p) => {
    const src = typeof p === 'string' ? p : p.src;
    return src === city.heroImage;
  })?.orientation ?? 'landscape';

  return (
    <motion.div
      className="city-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero */}
      <div
        className={`city-page__hero${heroOrientation === 'portrait' ? ' city-page__hero--portrait' : ''}`}
        style={city.heroImage ? { backgroundImage: `url(${city.heroImage})` } : {}}
      >
        <div className="city-page__hero-overlay" />
        <div className="city-page__hero-content">
          <button className="city-page__back" onClick={() => navigate('/')}>
            ← Home
          </button>
          <h1 className="city-page__title">{city.name}</h1>
          <p className="city-page__country">{city.country} · {city.year}</p>
        </div>
      </div>

      {/* Photo grid */}
      <div className="city-page__gallery">
        {hasPhotos ? (
          <>
            <p className="city-page__count">{city.photos.length} photographs</p>
            <div className="photo-grid--editorial">
              {city.photos.map((photo, i) => (
                <motion.div
                  key={i}
                  className={`editorial-item editorial-item--${photo.orientation ?? 'landscape'}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.07, 0.5) }}
                  onClick={() => setLightboxIndex(i)}
                >
                  <img src={thumbSrc(photo.src)} alt={photo.alt} loading="lazy" decoding="async" />
                  <div className="editorial-item__overlay">
                    <span className="editorial-item__index">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="city-page__empty">
            <p>Photos coming soon for {city.name}.</p>
            <p className="city-page__empty-sub">
              This city is part of the collection — images will be added shortly.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            photos={city.photos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={() => setLightboxIndex((i) => (i - 1 + city.photos.length) % city.photos.length)}
            onNext={() => setLightboxIndex((i) => (i + 1) % city.photos.length)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Lightbox({ photos, index, onClose, onPrev, onNext }) {
  // Keyboard navigation
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
  const isPortrait = photo.orientation === 'portrait';

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
      <button
        className="lightbox__prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous"
      >‹</button>
      <button
        className="lightbox__next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next"
      >›</button>

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={photo.src}
          alt={photo.alt}
          className={`lightbox__img lightbox__img--${isPortrait ? 'portrait' : 'landscape'}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => e.stopPropagation()}
        />
      </AnimatePresence>

      {/* Caption */}
      <p className="lightbox__caption">{photo.alt}</p>
    </motion.div>
  );
}
