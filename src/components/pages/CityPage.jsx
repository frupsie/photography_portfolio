import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cities } from '../../data/cities';
import { thumbSrc } from '../../utils/thumb';
import PhotoLightbox from '../landing/PhotoLightbox';
import { useMatchMedia } from '../../hooks/useMatchMedia';

export default function CityPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  // As many as ~20 grid tiles fading up in sequence per city — the same
  // pattern already fixed on Gallery's own grid; this page never checked
  // the preference at all.
  const reduceMotion = useMatchMedia('(prefers-reduced-motion: reduce)');
  const city = cities.find((c) => c.slug === slug);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  // Whichever grid button opened the lightbox, so closing it returns
  // keyboard focus to where it left off — same pattern as Home's Frames
  // and Gallery's grid, both already on the shared PhotoLightbox.
  const lastFocusedRef = useRef(null);

  if (!city) {
    return (
      <div className="page-error">
        <h1>City not found</h1>
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

  // Shaped for PhotoLightbox ({src, alt?, city?, country?}). city.photos
  // entries don't carry their own city/country — redundant to store on
  // every photo of a page that's already scoped to one city — so it's
  // added here rather than duplicated in cities.js.
  const lightboxPhotos = city.photos.map((p) => ({
    src: p.src,
    alt: p.alt,
    city: city.name,
    country: city.country,
  }));

  const openLightbox = (i, e) => {
    lastFocusedRef.current = e.currentTarget;
    setLightboxIndex(i);
  };
  const closeLightbox = () => {
    setLightboxIndex(null);
    lastFocusedRef.current?.focus();
  };
  const goPrev = () => setLightboxIndex((i) => (i - 1 + lightboxPhotos.length) % lightboxPhotos.length);
  const goNext = () => setLightboxIndex((i) => (i + 1) % lightboxPhotos.length);

  return (
    <motion.div
      className="city-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5 }}
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
                <motion.button
                  type="button"
                  key={photo.src}
                  className={`editorial-item editorial-item--${photo.orientation ?? 'landscape'}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: Math.min(i * 0.07, 0.5) }}
                  onClick={(e) => openLightbox(i, e)}
                  aria-label={photo.alt || `${city.name}, ${city.country}`}
                >
                  {/* alt="": the aria-label above already names the photo for
                      assistive tech; the overlay index number is decorative. */}
                  <img src={thumbSrc(photo.src)} alt="" loading="lazy" decoding="async" />
                  <div className="editorial-item__overlay">
                    <span className="editorial-item__index">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Closing beat — same reasoning as Gallery's: this page
                previously ran straight from the last photo into the
                footer with no acknowledgment. */}
            <div className="city-page__closer">
              <p className="city-page__closer-lead">
                That&rsquo;s every photograph from {city.name} — for now.
              </p>
              <Link className="city-page__closer-cta" to="/contact">Get in touch</Link>
            </div>
          </>
        ) : (
          <div className="city-page__empty">
            <p>Photos coming soon for {city.name}.</p>
            <p className="city-page__empty-sub">
              This city is part of the collection. Images will be added shortly.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={lightboxPhotos}
            index={lightboxIndex}
            onClose={closeLightbox}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
