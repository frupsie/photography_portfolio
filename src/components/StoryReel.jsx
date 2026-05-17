/**
 * StoryReel — Instagram-Story-style auto-play photo reel.
 *
 * • 10 photos per day, deterministically seeded from today's date.
 * • 4.5s hold per photo → smooth 600ms crossfade to the next.
 * • Ken Burns: subtle scale + drift, direction randomised per index (stable).
 * • Progress bar: thin Instagram-style segments across the top.
 * • Controls: click zones (left / center / right thirds), ← → Space keys,
 *   hover-pause (desktop), swipe left/right (mobile).
 * • EXIF + city overlay, bottom-left.
 * • Reduced-motion: no auto-advance, no Ken Burns; manual nav only.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cities } from '../data/cities';
import { pickDaily } from '../utils/dailyShuffle';
import ExifCard from './landing/ExifCard';

const HOLD_MS  = 4500;  // ms each photo is displayed
const FADE_MS  = 0.6;   // crossfade duration in seconds (Framer)
const REEL_LEN = 10;    // photos per day

// ── Pool ──────────────────────────────────────────────────────────────────────

function buildPhotoPool() {
  const pool = [];
  const seen = new Set();
  const push = (src, city) => {
    if (!src || seen.has(src) || src.includes('placeholder')) return;
    seen.add(src);
    pool.push({ src, city: city.name, country: city.country });
  };
  cities.forEach((c) => {
    if (c.heroImage) push(c.heroImage, c);
    c.photos.forEach((p) => push(typeof p === 'string' ? p : p.src, c));
  });
  return pool;
}

// ── Ken Burns ─────────────────────────────────────────────────────────────────
// Deterministic dx/dy per index so it never shifts on re-render.
// Uses golden-angle spacing so successive photos never feel repetitive.
const GOLDEN_ANGLE = 137.508;
const MAX_DRIFT    = 2.5; // % translate

function burnsFor(idx) {
  const angle = (idx * GOLDEN_ANGLE) % 360;
  const rad   = angle * (Math.PI / 180);
  return {
    dx: `${(Math.cos(rad) * MAX_DRIFT).toFixed(2)}%`,
    dy: `${(Math.sin(rad) * MAX_DRIFT).toFixed(2)}%`,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StoryReel() {
  const photos  = useMemo(() => pickDaily(buildPhotoPool(), REEL_LEN), []);
  const [index,         setIndex]         = useState(0);
  const [paused,        setPaused]        = useState(false);   // manual / click pause
  const [hoverPaused,   setHoverPaused]   = useState(false);   // desktop hover pause
  const [showPauseHint, setShowPauseHint] = useState(false);
  const [progress,      setProgress]      = useState(0);       // 0..1 for active segment

  const reduced = useMemo(
    () => typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const isActuallyPaused = paused || hoverPaused;

  // Refs so the single rAF loop doesn't need re-mounting on every state change
  const pausedRef      = useRef(false);
  const startRef       = useRef(performance.now());
  const pauseEnterRef  = useRef(null);
  const hintTimerRef   = useRef(null);
  const touchStartXRef = useRef(null);

  // Keep pausedRef in sync
  useEffect(() => { pausedRef.current = isActuallyPaused; }, [isActuallyPaused]);

  // Adjust startRef when pausing / resuming so elapsed progress is preserved
  useEffect(() => {
    if (isActuallyPaused) {
      pauseEnterRef.current = performance.now();
    } else if (pauseEnterRef.current !== null) {
      startRef.current += performance.now() - pauseEnterRef.current;
      pauseEnterRef.current = null;
    }
  }, [isActuallyPaused]);

  // Single rAF loop (runs for the lifetime of the component)
  useEffect(() => {
    if (reduced) return;
    startRef.current = performance.now();
    let rafId;
    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (pausedRef.current) return;
      const t = Math.min(1, (now - startRef.current) / HOLD_MS);
      setProgress(t);
      if (t >= 1) {
        setIndex((i) => (i + 1) % photos.length);
        startRef.current = performance.now();
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [reduced, photos.length]); // runs once — stable deps

  // ── Navigation helpers ─────────────────────────────────────────────────────

  const go = useCallback((newIdx) => {
    setIndex(newIdx);
    startRef.current = performance.now();
    setProgress(0);
    // Re-enable play if manually paused
    setPaused(false);
  }, []);

  const prev = useCallback(
    () => go((index - 1 + photos.length) % photos.length),
    [index, photos.length, go],
  );
  const next = useCallback(
    () => go((index + 1) % photos.length),
    [index, photos.length, go],
  );

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const entering = !p;
      if (entering) {
        setShowPauseHint(true);
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = setTimeout(() => setShowPauseHint(false), 750);
      }
      return entering;
    });
  }, []);

  // ── Keyboard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === ' ')          { e.preventDefault(); togglePause(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, togglePause]);

  // ── Click zones ────────────────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    // If tapping on the overlay (EXIF area), ignore
    if (e.target.closest('.story-reel__overlay')) return;
    if (isActuallyPaused) { setPaused(false); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if      (x < 0.33) prev();
    else if (x > 0.67) next();
    else               togglePause();
  }, [isActuallyPaused, prev, next, togglePause]);

  // ── Swipe (mobile) ─────────────────────────────────────────────────────────
  const handleTouchStart = (e) => { touchStartXRef.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartXRef.current = null;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const photo = photos[index];
  const burns = burnsFor(index);

  return (
    <section
      className={`story-reel${isActuallyPaused ? ' story-reel--paused' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Story reel — left/right to navigate, center to pause"
    >
      {/* ── Progress bar ── */}
      <div className="story-reel__progress" role="presentation">
        {photos.map((_, i) => {
          const done   = i < index;
          const active = i === index;
          return (
            <div key={i} className="story-reel__bar">
              {(done || active) && (
                <div
                  className="story-reel__bar-fill"
                  style={active ? { width: `${(progress * 100).toFixed(2)}%` } : undefined}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Counter ── */}
      <div className="story-reel__counter" aria-live="polite">
        {String(index + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(photos.length).padStart(2, '0')}
      </div>

      {/* ── Photo crossfade ── */}
      <AnimatePresence mode="wait">
        <motion.img
          key={photo.src}
          src={photo.src}
          alt={photo.city ?? ''}
          className={`story-reel__img${!reduced && !isActuallyPaused ? ' story-reel__img--burns' : ''}`}
          style={{
            '--burns-dx': burns.dx,
            '--burns-dy': burns.dy,
            animationDuration: `${HOLD_MS}ms`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS }}
          draggable={false}
        />
      </AnimatePresence>

      {/* ── Pause hint (flash on pause) ── */}
      <AnimatePresence>
        {showPauseHint && (
          <motion.span
            className="story-reel__pause-hint"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.18 }}
          >⏸</motion.span>
        )}
      </AnimatePresence>

      {/* ── Info overlay (bottom-left) ── */}
      <div className="story-reel__overlay">
        {(photo.city || photo.country) && (
          <p className="story-reel__caption">
            <span className="story-reel__caption-city">{photo.city}</span>
            {photo.country && (
              <span className="story-reel__caption-country">{photo.country}</span>
            )}
          </p>
        )}
        <ExifCard photo={photo.src} compact className="story-reel__exif" />
      </div>
    </section>
  );
}
