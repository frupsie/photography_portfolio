import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cities } from '../../data/cities';

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
        className="city-page__hero"
        style={{ backgroundImage: `url(${city.heroImage})` }}
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
          <div className="photo-grid">
            {city.photos.map((photo, i) => (
              <motion.div
                key={i}
                className="photo-grid__item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setLightboxIndex(i)}
              >
                <img src={photo.src} alt={photo.alt} loading="lazy" />
              </motion.div>
            ))}
          </div>
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
  return (
    <motion.div
      className="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button className="lightbox__close" onClick={onClose}>✕</button>
      <button className="lightbox__prev" onClick={(e) => { e.stopPropagation(); onPrev(); }}>‹</button>
      <motion.img
        key={index}
        src={photos[index].src}
        alt={photos[index].alt}
        className="lightbox__img"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      />
      <button className="lightbox__next" onClick={(e) => { e.stopPropagation(); onNext(); }}>›</button>
      <p className="lightbox__caption">{photos[index].alt}</p>
      <p className="lightbox__counter">{index + 1} / {photos.length}</p>
    </motion.div>
  );
}
