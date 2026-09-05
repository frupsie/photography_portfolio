/**
 * PhotoLightbox — fullscreen photo viewer with EVF-inspired chrome.
 *
 * Used by:
 *   - the homepage "Frames" horizontal pan
 *   - Gallery page
 *   - City pages
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

const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Prev/Next lost their solid chip on mobile (see App.css) because a narrow
// phone leaves no gutter beside a 96vw photo to put them in — swipe is the
// primary way to browse there now. This is the one-time nudge that tells a
// first-time visitor swipe exists at all, before they've had a reason to
// try it. Marked seen in localStorage the moment it's shown, not when it's
// dismissed, so it never comes back even if this exact viewing was cut
// short by navigating on to another photo.
const SWIPE_HINT_SEEN_KEY = 'photo-lightbox-swipe-hint-seen';
const SWIPE_HINT_DURATION_MS = 2500;

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

// Reduced motion: a plain crossfade, no directional slide or zoom — still
// real feedback that the photo changed, without the translation/scale
// prefers-reduced-motion exists to avoid. Dragging itself stays on: it's
// motion the visitor directly drives in real time, not an autoplaying
// transition, the same reasoning that keeps hover/tap micro-interactions
// on elsewhere on the site.
const imageVariantsReduced = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
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
  const isMobile = useMatchMedia('(max-width: 768px)');
  const reduceMotion = useMatchMedia(REDUCE_MOTION_QUERY);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const rootRef = useRef(null);
  const closeRef = useRef(null);
  // Not state: read once per navigation, inside a handler, never needs
  // to trigger its own render — the index change from onPrev/onNext
  // already does that.
  const directionRef = useRef(0);

  // Nothing to swipe to with one photo, and desktop never lost its
  // buttons in the first place — the hint only earns its one-time
  // appearance where swipe is genuinely the primary way to browse.
  useEffect(() => {
    if (!isMobile || !hasMultiple) return;
    try {
      if (localStorage.getItem(SWIPE_HINT_SEEN_KEY)) return;
      localStorage.setItem(SWIPE_HINT_SEEN_KEY, '1');
    } catch {
      // Private browsing / storage blocked: no way to remember it was
      // shown, so skip it rather than risk showing it on every visit.
      return;
    }
    setShowSwipeHint(true);
    // Deliberately no [isMobile, hasMultiple] dependents beyond mount —
    // re-checking mid-session (e.g. a resize past the breakpoint) could
    // re-show a hint already spent on this visitor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showSwipeHint) return;
    const timer = setTimeout(() => setShowSwipeHint(false), SWIPE_HINT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [showSwipeHint]);

  const goPrev = useCallback(() => {
    directionRef.current = -1;
    setShowSwipeHint(false);
    onPrev();
  }, [onPrev]);
  const goNext = useCallback(() => {
    directionRef.current = 1;
    setShowSwipeHint(false);
    onNext();
  }, [onNext]);

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

      {/* Groups the image and its EXIF card so mobile can scroll the pair
          together (see .photo-lightbox__content) without the counter/close
          controls above scrolling along with them — those stay children of
          .photo-lightbox itself, outside this wrapper, so they're never
          part of what scrolls. Prev/Next travel WITH this wrapper on
          purpose (see below) — if it ever scrolls, the buttons should move
          with the photo they're anchored to, not stay fixed on screen.
          Desktop doesn't use the scroll behavior at all; the wrapper is
          inert there. */}
      <div className="photo-lightbox__content">
        {/* Image with EVF corner brackets. Prev/Next live here — not as
            .photo-lightbox siblings — specifically so position:50%/top
            below resolves against THIS box, not the full screen. img-wrap
            has no explicit size; it shrink-wraps to whatever the image
            actually renders at (max-width/max-height cap it, nothing
            stretches it), so its box IS the photo's box. Positioning
            against the screen instead (the previous approach) put the
            arrows at literal viewport-center, which only matched the
            photo's own center by coincidence — confirmed live off by
            60-70px for both a landscape and a portrait photo, since
            neither orientation's rendered height happens to fill the
            centered safe area App.css defines. This fixes both
            orientations at once with no orientation-specific CSS, because
            it never needs to know which one it's looking at. */}
        <div className="photo-lightbox__img-wrap" onClick={(e) => e.stopPropagation()}>
          {/* hasMultiple: see its declaration above for why this is a
              visibility gate, not a disabled state. */}
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
          <AnimatePresence mode="wait" custom={directionRef.current}>
            <motion.img
              key={photo.src}
              src={photo.src}
              alt={photo.alt ?? photo.city ?? ''}
              className="photo-lightbox__img"
              custom={directionRef.current}
              variants={reduceMotion ? imageVariantsReduced : imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduceMotion ? { duration: 0.15 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
              // Dismisses the swipe hint the moment a drag actually starts —
              // even one that doesn't clear the swap threshold below is
              // still the visitor discovering the gesture, which is the
              // hint's entire job.
              onDragStart={() => setShowSwipeHint(false)}
              onDragEnd={handleDragEnd}
              draggable={false}
            />
          </AnimatePresence>
          <span className="photo-lightbox__corner photo-lightbox__corner--tl" />
          <span className="photo-lightbox__corner photo-lightbox__corner--tr" />
          <span className="photo-lightbox__corner photo-lightbox__corner--bl" />
          <span className="photo-lightbox__corner photo-lightbox__corner--br" />
          {/* One-time nudge (see SWIPE_HINT_SEEN_KEY above) toward the
              gesture that replaced the old always-visible button chip.
              pointer-events:none (App.css) so it's never what actually
              catches that first swipe. */}
          <AnimatePresence>
            {showSwipeHint && (
              <motion.div
                className="photo-lightbox__swipe-hint"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.3 }}
              >
                <motion.span
                  className="photo-lightbox__swipe-hint-icon"
                  animate={reduceMotion ? undefined : { x: [0, -4, 0] }}
                  transition={reduceMotion ? undefined : { duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronIcon direction="left" />
                </motion.span>
                Swipe to browse
                <motion.span
                  className="photo-lightbox__swipe-hint-icon"
                  animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
                  transition={reduceMotion ? undefined : { duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronIcon direction="right" />
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* EXIF pinned bottom-left on desktop; flows directly under the
            image on mobile (see the mobile block in App.css). Always
            rendered at every width — a collapsed-behind-a-tap version on
            mobile meant the block's height (and so its vertical center)
            changed every time it was toggled, visibly shifting the photo
            itself; always-visible keeps the whole block's height, and the
            photo's position, stable from the moment the lightbox opens. */}
        <div className="photo-lightbox__exif" onClick={(e) => e.stopPropagation()}>
          <ExifCard photo={photo.src} compact={false} />
          {(photo.city || photo.country) && (
            <p className="photo-lightbox__caption">
              {photo.city}{photo.country ? ` · ${photo.country}` : ''}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
