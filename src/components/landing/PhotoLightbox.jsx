/**
 * PhotoLightbox — fullscreen photo viewer with EVF-inspired chrome.
 *
 * Used by:
 *   - the homepage "Frames" horizontal pan
 *   - Gallery page
 *
 * Props:
 *   photos: [{ src, alt?, city?, country? }]
 *   index:  number
 *   onClose, onPrev, onNext
 *
 * Caller is responsible for wrapping in <AnimatePresence> and gating on
 * `index !== null` — the lightbox always renders when mounted. Caller is
 * also responsible for restoring focus to whatever opened it: this
 * component only manages focus *inside* itself, since it has no way to
 * know what triggered it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExifCard from './ExifCard';
import { useMatchMedia } from '../../hooks/useMatchMedia';

// Drawn to match the site's existing hand-rolled icon convention (Navbar's
// close, AboutPage's arrow): viewBox 24, strokeWidth 1.5, round caps/joins.
// The previous ✕ ‹ › were Unicode glyphs standing in for an icon system.
function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon({ direction, ...props }) {
  const d = direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" {...props}>
      <path d={d} />
    </svg>
  );
}

// Swipe commit thresholds: a long-enough drag OR a fast-enough flick,
// whichever comes first — matches how a real photo viewer reads a
// gesture rather than forcing one uniform distance.
const SWIPE_OFFSET_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 500;

// Direction-aware enter/exit: the photo that leaves travels the way the
// swipe (or arrow key) sent it, and the next one enters from the
// opposite edge, so the transition reads as continuous motion rather
// than an unrelated crossfade. The AF corner brackets don't move with
// it — they're siblings positioned on the wrap, not the image — so they
// read as a fixed viewfinder frame with the shot sliding through it.
const imageVariants = {
  enter: (direction) => ({ x: direction > 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction) => ({ x: direction > 0 ? -60 : 60, opacity: 0, scale: 0.97 }),
};

export default function PhotoLightbox({ photos, index, onClose, onPrev, onNext }) {
  const photo = photos[index];
  // A filtered city with exactly one photo (Macau, at last count) still
  // rendered fully-styled, clickable Prev/Next that silently did nothing —
  // every other control on this page trains a visitor that pressing it
  // does something, so a control that quietly doesn't breaks that trust
  // right where the surrounding craft sets a high bar for what "broken"
  // looks like. Hidden rather than disabled: a dimmed control still
  // implies "normally there's something here," which isn't true — there
  // is nothing to navigate to, full stop.
  const hasMultiple = photos.length > 1;
  // The photo is the thing a visitor came for; the EXIF card is real,
  // credible detail but still secondary — "the photographs lead, chrome
  // that competes with a photograph is wrong by default." On a phone the
  // two compete for the same scarce vertical space (the photo itself is
  // width-capped by the viewport, so it can't grow to make room), so on
  // mobile only, EXIF starts collapsed behind a tap — same as how a
  // camera's own rear LCD shows the shot first and overlays shooting
  // info on demand, not as a permanent fixture. Desktop has room for
  // both at once and is untouched.
  const isMobile = useMatchMedia('(max-width: 768px)');
  const [exifOpen, setExifOpen] = useState(false);
  const rootRef = useRef(null);
  const closeRef = useRef(null);
  // Not state: read once per navigation, inside a handler, never needs
  // to trigger its own render — the index change from onPrev/onNext
  // already does that.
  const directionRef = useRef(0);

  const goPrev = useCallback(() => { directionRef.current = -1; onPrev(); }, [onPrev]);
  const goNext = useCallback(() => { directionRef.current = 1; onNext(); }, [onNext]);

  const handleDragEnd = useCallback((e, info) => {
    const { offset, velocity } = info;
    if (offset.x < -SWIPE_OFFSET_THRESHOLD || velocity.x < -SWIPE_VELOCITY_THRESHOLD) {
      goNext();
    } else if (offset.x > SWIPE_OFFSET_THRESHOLD || velocity.x > SWIPE_VELOCITY_THRESHOLD) {
      goPrev();
    }
    // Anything short of the threshold: no action needed. Framer's own
    // drag-constraint spring returns the image to x:0 on its own.
  }, [goPrev, goNext]);

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowLeft')  goPrev();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'Escape')     onClose();

    // Focus trap: a fullscreen viewer over the whole page is exactly the
    // case that earns protected focus (craft-floor's bar for a modal at
    // all). Without this, Tab walks straight through into the gallery
    // grid behind it, which the visitor can't currently see.
    if (e.key === 'Tab') {
      const root = rootRef.current;
      if (!root) return;
      const focusable = [...root.querySelectorAll('button')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [goPrev, goNext, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Each photo gets its own fresh "photo first" moment on mobile — leaving
  // EXIF expanded from the last one would mean only the very first photo
  // in a session ever gets the collapsed treatment.
  useEffect(() => {
    setExifOpen(false);
  }, [photo?.src]);

  // Move focus into the dialog the moment it mounts. Escape and Tab above
  // both assume focus already lives in here — without this, a keyboard
  // user who somehow triggered the lightbox would find both dead on arrival.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  if (!photo) return null;

  return (
    <motion.div
      ref={rootRef}
      className="photo-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${photos.length}${photo.city ? `, ${photo.city}` : ''}`}
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
        ref={closeRef}
        className="photo-lightbox__close"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
      >
        <CloseIcon />
      </button>

      {/* Prev / Next — only when there's somewhere to go */}
      {hasMultiple && (
        <>
          <button
            className="photo-lightbox__prev"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous photo"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            className="photo-lightbox__next"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next photo"
          >
            <ChevronIcon direction="right" />
          </button>
        </>
      )}

      {/* Groups the image and its EXIF card so mobile can scroll the pair
          together (see .photo-lightbox__content) without the counter/
          close/prev/next controls above scrolling along with them —
          those stay children of .photo-lightbox itself, outside this
          wrapper, so they're never part of what scrolls. Desktop doesn't
          use the scroll behavior at all; the wrapper is inert there. */}
      <div className="photo-lightbox__content">
        {/* Image with EVF corner brackets */}
        <div className="photo-lightbox__img-wrap" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence mode="wait" custom={directionRef.current}>
            <motion.img
              key={photo.src}
              src={photo.src}
              alt={photo.alt ?? photo.city ?? ''}
              className="photo-lightbox__img"
              custom={directionRef.current}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              // 1:1 finger tracking with elastic resistance, not a fixed
              // travel distance — dragConstraints pinned to 0 plus
              // dragElastic is Framer's own pattern for "drag freely, then
              // spring back to center" unless onDragEnd decides to swap
              // the photo instead. onClick above already stops the
              // backdrop-close click from firing on a tap; a drag that
              // doesn't clear the threshold is indistinguishable from a
              // tap to Framer's own gesture recognizer, so no extra
              // handling is needed for that case. Off entirely when
              // there's only one photo, for the same reason Prev/Next are
              // hidden rather than dead: nothing to swipe to.
              drag={hasMultiple ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              draggable={false}
            />
          </AnimatePresence>
          <span className="photo-lightbox__corner photo-lightbox__corner--tl" />
          <span className="photo-lightbox__corner photo-lightbox__corner--tr" />
          <span className="photo-lightbox__corner photo-lightbox__corner--bl" />
          <span className="photo-lightbox__corner photo-lightbox__corner--br" />
        </div>

        {/* EXIF pinned bottom-left on desktop; flows directly under the
            image on mobile (see the mobile block in App.css). DOM order
            stays (card, caption, toggle) at every width — mobile reorders
            them visually via CSS `order` so the caption and the toggle
            lead and the card follows once opened, without a second JSX
            branch to keep in sync with this one. `!isMobile ||` keeps
            desktop's actual render — the card is always in the tree, the
            toggle never is — byte-identical to before this change. */}
        <div className="photo-lightbox__exif" onClick={(e) => e.stopPropagation()}>
          {(!isMobile || exifOpen) && <ExifCard photo={photo.src} compact={false} />}
          {(photo.city || photo.country) && (
            <p className="photo-lightbox__caption">
              {photo.city}{photo.country ? ` · ${photo.country}` : ''}
            </p>
          )}
          {isMobile && (
            <button
              type="button"
              className="photo-lightbox__exif-toggle"
              onClick={() => setExifOpen((open) => !open)}
              aria-expanded={exifOpen}
            >
              {exifOpen ? 'Hide shooting info' : 'Shooting info'}
              <ChevronIcon direction="right" className="photo-lightbox__exif-toggle-icon" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
