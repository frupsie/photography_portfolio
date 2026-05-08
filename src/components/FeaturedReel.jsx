/**
 * FeaturedCarousel — horizontal snap carousel for curated best shots.
 * Data source: src/data/featured.js
 * Navigation: drag / touch-swipe / arrow buttons / dots
 * Vertical scroll is NOT intercepted — page scrolls freely at all times.
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { featured } from '../data/featured';

const N   = featured.length;
const GAP = 16; // px — must stay in sync with CSS gap

// ─── Main component ────────────────────────────────────────────────────────────
export default function FeaturedCarousel() {
  const trackRef    = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // ── Detect active card via scroll position ──
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const cardW = track.firstElementChild?.getBoundingClientRect().width ?? 0;
      if (cardW === 0) return;
      const idx = Math.round(track.scrollLeft / (cardW + GAP));
      setActiveIdx(Math.max(0, Math.min(N - 1, idx)));
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  // ── Programmatic scroll to card index (arrows + dots) ──
  const scrollTo = useCallback((idx) => {
    const track = trackRef.current;
    if (!track) return;
    const cardW = track.firstElementChild?.getBoundingClientRect().width ?? 0;
    track.scrollTo({ left: idx * (cardW + GAP), behavior: 'smooth' });
  }, []);

  return (
    <section className="carousel">

      {/* ── Header: heading left · arrows + counter right ── */}
      <div className="carousel__header">
        <div>
          <h2 className="carousel__heading">Best Shots</h2>
          <p className="carousel__sub">A few frames worth keeping</p>
        </div>

        {/* Controls: prev — counter — next */}
        <div className="carousel__controls">
          <button
            className="carousel__arrow"
            onClick={() => scrollTo(activeIdx - 1)}
            disabled={activeIdx === 0}
            aria-label="Previous photo"
          >
            ‹
          </button>

          <div className="carousel__counter" aria-live="polite">
            <span className="carousel__counter-current">
              {String(activeIdx + 1).padStart(2, '0')}
            </span>
            <span className="carousel__counter-sep" />
            <span>{String(N).padStart(2, '0')}</span>
          </div>

          <button
            className="carousel__arrow"
            onClick={() => scrollTo(activeIdx + 1)}
            disabled={activeIdx === N - 1}
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Scrollable card strip ── */}
      <div className="carousel__track-wrapper">
        <div ref={trackRef} className="carousel__track" role="list">
          {featured.map((item, i) => (
            <CarouselCard
              key={item.photo}
              item={item}
              active={i === activeIdx}
            />
          ))}
        </div>
      </div>

      {/* ── Dot indicators ── */}
      <div className="carousel__dots" role="tablist" aria-label="Photo navigation">
        {featured.map((_, i) => (
          <button
            key={i}
            className={`carousel__dot${i === activeIdx ? ' carousel__dot--active' : ''}`}
            onClick={() => scrollTo(i)}
            aria-label={`Go to photo ${i + 1}: ${featured[i].city}`}
            aria-selected={i === activeIdx}
            role="tab"
          />
        ))}
      </div>

    </section>
  );
}

// ─── Individual card ───────────────────────────────────────────────────────────
function CarouselCard({ item, active }) {
  return (
    <motion.article
      className="carousel__card"
      role="listitem"
      animate={{
        opacity: active ? 1 : 0.65,
        scale:   active ? 1 : 0.96,
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Photo */}
      <div className="carousel__card-photo">
        <img
          src={item.photo}
          alt={`${item.city}, ${item.country}`}
          loading="lazy"
          draggable="false"
        />
      </div>

      {/* Gradient overlay */}
      <div className="carousel__card-overlay" />

      {/* Labels */}
      <div className="carousel__card-info">
        <span className="carousel__card-country">{item.country}</span>
        <h3 className="carousel__card-city">{item.city}</h3>
        <span className="carousel__card-year">{item.year}</span>
      </div>
    </motion.article>
  );
}
