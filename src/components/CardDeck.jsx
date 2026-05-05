import { useRef, useState, useEffect, useLayoutEffect, useCallback, memo } from 'react';
import { useMotionValue, useTransform, useMotionValueEvent, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cities } from '../data/cities';

// Take over scroll restoration so we can replay it after framer-motion is ready
if (typeof window !== 'undefined') {
  history.scrollRestoration = 'manual';
}

const n = cities.length; // 11
const SCROLL_PER_CARD = 45; // vh of scroll per card

// Extra scroll before first card peels — cards settle into the stack during this window
const DELAY_VH = 40;
// Total scroll range = cards + delay (viewport height is added separately as sticky height)
const SCROLL_RANGE_VH = n * SCROLL_PER_CARD + DELAY_VH; // 535vh
// Fraction of scroll progress that is the settle-in phase
const DELAY = DELAY_VH / SCROLL_RANGE_VH; // ≈ 0.075

const OFFSETS = [
  { x:  '1.5%', rot: -1.2 },
  { x: '-2.0%', rot:  1.5 },
  { x:  '2.5%', rot: -0.7 },
  { x: '-1.0%', rot:  1.8 },
  { x:  '0.5%', rot: -1.4 },
  { x: '-2.5%', rot:  0.9 },
  { x:  '1.8%', rot: -1.0 },
  { x: '-0.8%', rot:  1.3 },
  { x:  '2.2%', rot: -0.5 },
  { x: '-1.5%', rot:  1.6 },
  { x:  '0.8%', rot: -1.8 },
];

const COUNTRY_BG = {
  'China':       'linear-gradient(145deg, #3a1a0a 0%, #7c3618 40%, #c46030 75%, #e08848 100%)',
  'Japan':       'linear-gradient(145deg, #0e1828 0%, #1e3050 40%, #2e5080 75%, #4070a0 100%)',
  'South Korea': 'linear-gradient(145deg, #2a2010 0%, #564520 40%, #8a6c30 75%, #b09050 100%)',
};

/* ─── Scroll driver ──────────────────────────────────────────────── */
export default function CardDeck() {
  const containerRef = useRef();
  const scrollYProgress = useMotionValue(0);
  const scrollRestored = useRef(false);

  // Persist scroll position so we can replay it after framer-motion initialises
  useEffect(() => {
    const save = () => sessionStorage.setItem('deck_scrollY', String(window.scrollY));
    window.addEventListener('beforeunload', save);
    return () => window.removeEventListener('beforeunload', save);
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      scrollYProgress.set(Math.max(0, Math.min(1, -rect.top / total)));
    };
    document.addEventListener('scroll', update, { passive: true });
    update(); // page is at top (scroll restoration disabled), so this sets 0

    // Restore saved scroll position once framer-motion's frame loop is live.
    // Two rAFs: 1st lets React finish painting; 2nd lets framer-motion run its
    // first scheduler tick so all useTransform subscriptions are active.
    if (!scrollRestored.current) {
      const raw = sessionStorage.getItem('deck_scrollY');
      if (raw !== null) {
        scrollRestored.current = true;
        sessionStorage.removeItem('deck_scrollY');
        const targetY = parseInt(raw, 10);
        if (targetY > 0) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo(0, targetY);
            });
          });
        }
      }
    }

    return () => document.removeEventListener('scroll', update);
  }, [scrollYProgress]);

  // Hint fades out at the end of the settle window, just before first peel
  const hintOpacity = useTransform(scrollYProgress, [DELAY * 0.4, DELAY], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="deck-container"
      style={{ height: `${SCROLL_RANGE_VH + 100}vh` }}
    >
      <div className="deck-sticky">

        <ActiveCityInfo scrollYProgress={scrollYProgress} />

        <div className="deck-stack">
          {Array.from({ length: n }, (_, j) => n - 1 - j).map((i) => (
            <DeckCard
              key={cities[i].slug}
              city={cities[i]}
              index={i}
              isLast={i === n - 1}
              offset={OFFSETS[i % OFFSETS.length]}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>

        <motion.p className="deck-hint" style={{ opacity: hintOpacity }}>
          scroll to explore
        </motion.p>

      </div>
    </section>
  );
}

/* ─── Active city counter + label ───────────────────────────────── */
function ActiveCityInfo({ scrollYProgress }) {
  const computeIndex = useCallback((p) => {
    const animP = Math.max(0, (p - DELAY) / (1 - DELAY));
    // Each card peels over 0.8/n of animP. +0.65 triggers label change
    // roughly when the card's bottom edge exits the top of the viewport.
    return Math.min(Math.max(0, Math.floor(animP * n + 0.65)), n - 1);
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);

  // Sync to current scroll position on mount (handles page refresh mid-scroll)
  useEffect(() => {
    setActiveIndex(computeIndex(scrollYProgress.get()));
  }, [computeIndex, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    setActiveIndex(computeIndex(p));
  });

  const labelColor = '#ffffff';

  return (
    <>
      <div className="deck-counter">
        <span className="deck-counter__current">{String(activeIndex + 1).padStart(2, '0')}</span>
        <span className="deck-counter__sep" />
        <span className="deck-counter__total">{String(n).padStart(2, '0')}</span>
      </div>

      <div className="deck-label">
        <motion.span className="deck-label__country" style={{ color: labelColor }}>
          {cities[activeIndex].country}
        </motion.span>
        <motion.h2 className="deck-label__city" style={{ color: labelColor }}>
          {cities[activeIndex].name}
        </motion.h2>
      </div>
    </>
  );
}

/* ─── Individual card ────────────────────────────────────────────── */
const DeckCard = memo(function DeckCard({ city, index: i, isLast, offset, scrollYProgress }) {
  // Raw peel positions (0–1 within the post-delay animation range)
  const peel_start = i / n;
  const peel_end   = Math.min((i + 0.8) / n, 0.995);

  // Remap into actual scrollYProgress space (DELAY → 1)
  const ps = DELAY + peel_start * (1 - DELAY); // actual sp when card becomes active
  const pe = DELAY + peel_end   * (1 - DELAY); // actual sp when card finishes peeling

  // Stack depth — cards behind the top sit lower
  const init_vh    = Math.min(i, 3) * 3.0;
  // During settle, cards start slightly further out and drift in
  const settle_vh  = init_vh * 1.7;

  // Scale: slightly compressed during settle, rises as card approaches active
  const init_scale    = Math.max(0.88, 1 - Math.min(i, 3) * 0.04);
  const settle_scale  = Math.max(0.84, init_scale - 0.04);

  // ── Y: settle drift → active → peel off (or hold for last card) ──
  const y = useTransform(
    scrollYProgress,
    [0,              DELAY,          ps,     pe,                              1],
    [`${settle_vh}vh`, `${init_vh}vh`, '0vh', isLast ? '0vh' : '-120vh', isLast ? '0vh' : '-120vh']
  );

  // ── Rotate: slight extra angle during settle, flick on peel ──
  const settle_rot = offset.rot + Math.min(i, 2) * 0.9;
  const rotate = useTransform(
    scrollYProgress,
    [0,          DELAY,      ps,         pe],
    [settle_rot, offset.rot, offset.rot, isLast ? offset.rot : offset.rot - 6]
  );

  // ── Scale: settle compression → full size when active ──
  const scale = useTransform(
    scrollYProgress,
    [0,            DELAY,      Math.max(ps + 0.001, pe)],
    [settle_scale, init_scale, 1]
  );

  const bg = COUNTRY_BG[city.country] ?? COUNTRY_BG['Japan'];

  return (
    <motion.div
      className="deck-card"
      style={{ y, rotate, scale, x: offset.x, zIndex: n - i }}
    >
      <Link to={`/city/${city.slug}`} className="deck-card__inner">
        <div
          className="deck-card__photo"
          style={{
            backgroundImage: city.heroImage ? `url(${city.heroImage})` : bg,
          }}
        />
        <div className="deck-card__overlay" />

        <div className="deck-card__top">
          <span className="deck-card__country-tag">{city.country}</span>
          <span className="deck-card__year">{city.year}</span>
        </div>

        <div className="deck-card__bottom">
          <h3 className="deck-card__name">{city.name}</h3>
          {city.photos.length > 0 && (
            <span className="deck-card__count">{city.photos.length} photos</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
});
