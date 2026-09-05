/**
 * IntroScreen — Canon EOS R5 Mark II EVF-style camera loading screen.
 * The camera UI lives inside a compact 3:2 viewfinder box centred on screen.
 * Shutter blades and flash still cover the full viewport.
 */
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { photoMeta } from '../data/photo-meta';

const BRACKETS     = ['tl', 'tr', 'bl', 'br'];
const BRACKET_DELAYS = { tl: 0, tr: 0.06, bl: 0.10, br: 0.15 };
const AF_DOTS      = Array.from({ length: 15 }, (_, i) => i); // 5 × 3 grid

// Must match .intro__bg's background-image in App.css — no way to share one
// constant between a CSS rule and this component, so keep them in sync by
// hand if the hero photo ever changes.
const INTRO_PHOTO = '/photos-web/hong-kong/_MG_3601.JPG';

// The topbar used to show invented values (1/500, F1.8, ISO 400) — numbers
// attached to no photograph, in the exact visual language ExifCard uses
// sitewide for genuine EXIF. Reading photoMeta directly (not the async
// useExif hook, which resolves after a dynamic import + file parse) because
// this needs a value synchronously, before the HUD's own 400ms reveal.
// Falls back to the original placeholder values only if this specific
// photo's entry is ever removed from photo-meta.js.
const introExif      = photoMeta[INTRO_PHOTO] ?? {};
const INTRO_SHUTTER  = introExif.shutter ?? '1/500';
// This HUD's own convention is "F1.8" (bare, capital F) — matches how it
// already shows shutter speed as bare "1/500", not "1/500s". Reformatted
// from photo-meta.js's sitewide "f/6.3" convention, not a second data source.
const INTRO_APERTURE = introExif.aperture ? `F${introExif.aperture.replace(/^f\//, '')}` : 'F1.8';
const INTRO_ISO      = introExif.iso ? introExif.iso.replace(/^ISO\s*/, '') : '400';

export default function IntroScreen({ onDone }) {
  const [phase, setPhase] = useState('enter');
  const [pct, setPct]     = useState(0);
  const timers = useRef([]);
  const rootRef = useRef(null);

  // Reduced motion: skip the whole sequence rather than soften it.
  //
  // This is the most aggressive motion on the site — shutter blades closing over
  // the full viewport, then .intro__flash animating opacity 0 -> 1 in 70ms, a
  // near-white flash on a near-black page. A luminance jump that size is a
  // vestibular and photosensitivity concern, and the only escape was a 9.6px
  // skip control nobody is hunting for. There is no reduced version of this
  // worth showing, so hand straight off to the site.
  const [reduced] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reduced) onDone();
  }, [reduced, onDone]);

  // Focus containment: a full-viewport overlay is exactly the case that
  // earns protected focus (same reasoning as PhotoLightbox's and the nav
  // drawer's traps), and this one previously had neither — a keyboard
  // user's Tab could escape straight into the homepage sitting behind it,
  // which they can't currently see. Skip is the only focusable element
  // here, so "trapping" Tab just means it always lands back on itself.
  useEffect(() => {
    if (reduced) return;
    rootRef.current?.querySelector('.intro__skip')?.focus();

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const root = rootRef.current;
      if (!root) return;
      const focusable = [...root.querySelectorAll('button')];
      if (!focusable.length) return;
      e.preventDefault();
      focusable[0].focus();
    };
    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [reduced]);

  const schedule = (fn, delay) => {
    const id = setTimeout(fn, delay);
    timers.current.push(id);
  };
  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Count 0→100 % over the hud phase (400ms → 2800ms = 2400ms)
  useEffect(() => {
    if (phase !== 'hud') return;
    const DURATION = 2400;
    const TICK     = 30;
    const steps    = DURATION / TICK;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setPct(Math.min(100, Math.round((step / steps) * 100)));
      if (step >= steps) clearInterval(id);
    }, TICK);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (reduced) return;              // handed off above; run no timers
    schedule(() => setPhase('hud'),      400);
    schedule(() => setPhase('lock'),    2800);
    schedule(() => setPhase('shutter'), 3300);
    schedule(() => setPhase('flash'),   3450);
    schedule(() => setPhase('exit'),    3550);

    // The phase timing above is art-directed choreography, not a real
    // progress measurement — the previous version handed off to the
    // homepage at exactly 4150ms regardless of whether its own hero photo
    // (the same file this screen shows as .intro__bg) had actually
    // finished loading. On a slow connection the "100% / LOCK ON" moment
    // could fire while the real image was still loading — a fake
    // completion signal in exactly the case a real one would matter.
    // Waiting on whichever finishes later costs nothing on any normal
    // connection (this photo is well under 4.15s to load) and only
    // protects the slow one. A hard cap keeps a genuinely broken image
    // request from stalling the handoff indefinitely.
    let done = false;
    let timerDone = false;
    let imgDone = false;
    const finish = () => {
      if (done || !timerDone || !imgDone) return;
      done = true;
      onDone();
    };
    schedule(() => { timerDone = true; finish(); }, 4150);

    const heroImg = new Image();
    heroImg.onload = heroImg.onerror = () => { imgDone = true; finish(); };
    heroImg.src = INTRO_PHOTO;
    schedule(() => { imgDone = true; finish(); }, 8000); // hard cap

    return clearAll;
  }, [reduced]);

  const skip = () => {
    clearAll();
    setPhase('shutter');
    schedule(() => setPhase('flash'),  150);
    schedule(() => setPhase('exit'),   300);
    schedule(() => onDone(),           850);
  };

  // Render nothing at all under reduced motion — no shutter, no flash, no frame.
  if (reduced) return null;

  const isHud     = ['hud', 'lock', 'shutter', 'flash', 'exit'].includes(phase);
  const isLocked  = ['lock', 'shutter', 'flash', 'exit'].includes(phase);
  const isShutter = ['shutter', 'flash', 'exit'].includes(phase);
  const isFlash   = phase === 'flash';
  const isExit    = phase === 'exit';

  return (
    <motion.div
      ref={rootRef}
      className="intro"
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
      animate={{ opacity: isExit ? 0 : 1 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
    >
      {/* ══════════════════════════════════════════════════════
          VIEWFINDER BOX — compact 3:2 camera window
          ══════════════════════════════════════════════════════ */}
      <div className="intro__viewfinder">

        {/* Hero photo clipped to viewfinder */}
        <motion.div
          className="intro__bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.32 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Rule-of-thirds grid */}
        <motion.div
          className="intro__grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* Corner viewfinder brackets */}
        {BRACKETS.map(pos => (
          <motion.div
            key={pos}
            className={`intro__bracket intro__bracket--${pos}`}
            initial={{ opacity: 0, scale: 1.25 }}
            animate={{
              opacity: isHud ? 1 : 0,
              scale: 1,
              borderColor: isLocked
                ? 'rgba(60,220,60,0.85)'
                : 'rgba(255,255,255,0.5)',
            }}
            transition={{
              opacity:     { duration: 0.3,  delay: BRACKET_DELAYS[pos] },
              scale:       { duration: 0.4,  delay: BRACKET_DELAYS[pos] },
              borderColor: { duration: 0.18 },
            }}
          />
        ))}

        {/* ── TOP BAR ── [M]  1/500  F1.8  ISO 400  AWB ⊙ ▭ IS ████ */}
        <motion.div
          className="intro__topbar"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: isHud ? 1 : 0, y: isHud ? 0 : -5 }}
          transition={{ duration: 0.28 }}
        >
          <div className="intro__topbar-mode">M</div>
          <div className="intro__topbar-vals">
            <span>{INTRO_SHUTTER}</span>
            <span className="intro__topbar-aperture">{INTRO_APERTURE}</span>
            <span>ISO&thinsp;{INTRO_ISO}</span>
          </div>
          <div className="intro__topbar-icons">
            <span className="intro__topbar-wb">AWB</span>
            <span className="intro__topbar-icon">⊙</span>
            <span className="intro__topbar-icon">▭</span>
            <span className="intro__topbar-icon">IS</span>
            <span className="intro__battery">
              <span /><span /><span />
              <span className="intro__battery-empty" />
            </span>
          </div>
        </motion.div>

        {/* ── AF DOT GRID 5×3 ── */}
        <motion.div
          className="intro__af-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHud ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {AF_DOTS.map(i => (
            <span
              key={i}
              className={`intro__af-dot${i === 7 ? ' intro__af-dot--hidden' : ''}`}
            />
          ))}
        </motion.div>

        {/* ── CENTER AF FRAME ── */}
        <motion.div
          className="intro__af-frame"
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{
            opacity: isHud ? 1 : 0,
            scale: 1,
            borderColor: isLocked ? '#3cdc3c' : 'rgba(255,255,255,0.85)',
          }}
          transition={{
            opacity:     { duration: 0.28 },
            scale:       { duration: 0.38 },
            borderColor: { duration: 0.18 },
          }}
        >
          <motion.span
            className="intro__af-status"
            animate={{ color: isLocked ? '#3cdc3c' : 'rgba(190,190,190,0.75)' }}
            transition={{ duration: 0.18 }}
          >
            {isLocked ? 'LOCK ON' : 'SEARCHING…'}
          </motion.span>
        </motion.div>

        {/* ── LEVEL LINE ── */}
        <motion.div
          className="intro__level"
          initial={{ opacity: 0 }}
          animate={{
            opacity: isHud ? 1 : 0,
            backgroundColor: isLocked
              ? 'rgba(60,220,60,0.65)'
              : 'rgba(255,255,255,0.3)',
          }}
          transition={{ duration: 0.28, delay: 0.18 }}
        />

        {/* ── RIGHT EXPOSURE METER +3…-3 ── */}
        <motion.div
          className="intro__meter"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHud ? 1 : 0 }}
          transition={{ duration: 0.38, delay: 0.12 }}
        >
          {['+3', '+2', '+1', '0', '-1', '-2', '-3'].map(label => (
            <div
              key={label}
              className={`intro__meter-tick${label === '0' ? ' intro__meter-tick--zero' : ''}`}
            >
              {label === '0'
                ? <span className="intro__meter-marker">▶</span>
                : <span>{label}</span>}
            </div>
          ))}
        </motion.div>

        {/* ── BOTTOM BAR ── RAW+L  exp scale  1724  CF-A */}
        <motion.div
          className="intro__bottombar"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: isHud ? 1 : 0, y: isHud ? 0 : 5 }}
          transition={{ duration: 0.28 }}
        >
          <span className="intro__bottombar-quality">RAW+L</span>

          <div className="intro__exp-scale">
            <span className="intro__exp-label">-2</span>
            <div className="intro__exp-ticks">
              {[-2, -1, 0, 1, 2].map(n => (
                <div
                  key={n}
                  className={`intro__exp-tick${n === 0 ? ' intro__exp-tick--center' : ''}`}
                />
              ))}
              <div className="intro__exp-dot" />
            </div>
            <span className="intro__exp-label">+2</span>
          </div>

          <div className="intro__bottombar-right">
            <span className="intro__shot-count">1724</span>
            <span className="intro__card-label">CF-A</span>
          </div>
        </motion.div>

      </div>{/* end .intro__viewfinder */}

      {/* ══════════════════════════════════════════════════════
          LOADING BAR — below viewfinder, outside the box
          ══════════════════════════════════════════════════════ */}
      <motion.div
        className="intro__loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHud ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="intro__loading-track">
          <motion.div
            className="intro__loading-fill"
            initial={{ width: '0%' }}
            animate={{ width: isHud ? '100%' : '0%' }}
            transition={{ duration: 2.4, ease: 'linear' }}
          />
        </div>
        <span className="intro__loading-pct">
          {isLocked ? '100' : pct}%
        </span>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          FULL-VIEWPORT ELEMENTS (shutter, flash, skip)
          ══════════════════════════════════════════════════════ */}
      <motion.div
        className="intro__shutter intro__shutter--top"
        initial={{ y: '-100%' }}
        animate={{ y: isShutter && !isExit ? '0%' : '-100%' }}
        transition={{ duration: 0.14, ease: [0.55, 0, 0.45, 1] }}
      />
      <motion.div
        className="intro__shutter intro__shutter--bottom"
        initial={{ y: '100%' }}
        animate={{ y: isShutter && !isExit ? '0%' : '100%' }}
        transition={{ duration: 0.14, ease: [0.55, 0, 0.45, 1] }}
      />
      <motion.div
        className="intro__flash"
        animate={{ opacity: isFlash ? 1 : 0 }}
        transition={{ duration: 0.07 }}
      />

      {!isShutter && (
        <button className="intro__skip" onClick={skip} aria-label="Skip intro">
          skip
        </button>
      )}
    </motion.div>
  );
}
