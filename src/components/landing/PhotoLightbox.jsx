/**
 * PhotoLightbox — fullscreen photo viewer with EVF-inspired chrome.
 *
 * Used by:
 *   - Act 3 "The Frames" (home reel)
 *   - Gallery page (replaces the inline GalleryLightbox)
 *   - (future) Featured page city cards
 *
 * Props:
 *   photos: [{ src, alt?, city?, country? }]
 *   index:  number
 *   onClose, onPrev, onNext
 *
 * Caller is responsible for wrapping in <AnimatePresence> and gating on
 * `index !== null` — the lightbox always renders when mounted.
 */
import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExifCard from './ExifCard';

export default function PhotoLightbox({ photos, index, onClose, onPrev, onNext }) {
  const photo = photos[index];

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowLeft')  onPrev();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'Escape')     onClose();
  }, [onPrev, onNext, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!photo) return null;

  return (
    <motion.div
      className="photo-lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
    >
      {/* Counter */}
      <div className="photo-lightbox__counter">
        <span className="photo-lightbox__counter-current">{String(index + 1).padStart(2, '0')}</span>
        <span className="photo-lightbox__counter-sep">/</span>
        <span>{String(photos.length).padStart(2, '0')}</span>
      </div>

      {/* Close */}
      <button
        className="photo-lightbox__close"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
      >✕</button>

      {/* Prev / Next */}
      <button
        className="photo-lightbox__prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous"
      >‹</button>
      <button
        className="photo-lightbox__next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next"
      >›</button>

      {/* Image with EVF corner brackets */}
      <div className="photo-lightbox__img-wrap" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          <motion.img
            key={photo.src}
            src={photo.src}
            alt={photo.alt ?? photo.city ?? ''}
            className="photo-lightbox__img"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            draggable={false}
          />
        </AnimatePresence>
        <span className="photo-lightbox__corner photo-lightbox__corner--tl" />
        <span className="photo-lightbox__corner photo-lightbox__corner--tr" />
        <span className="photo-lightbox__corner photo-lightbox__corner--bl" />
        <span className="photo-lightbox__corner photo-lightbox__corner--br" />
      </div>

      {/* EXIF pinned bottom-left */}
      <div className="photo-lightbox__exif" onClick={(e) => e.stopPropagation()}>
        <ExifCard photo={photo.src} compact={false} />
        {(photo.city || photo.country) && (
          <p className="photo-lightbox__caption">
            {photo.city}{photo.country ? ` · ${photo.country}` : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
}
