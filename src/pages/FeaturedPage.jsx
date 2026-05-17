/**
 * FeaturedPage — /featured route.
 *
 * Section 1: FlightMap — animated 2D Leaflet map showing every trip
 *            (planes between countries, trains/cars within them).
 * Section 2: StoryReel — 10 daily-shuffled photos, auto-play, full-bleed.
 */
import { motion } from 'framer-motion';
import FlightMap from '../components/FlightMap';
import StoryReel from '../components/StoryReel';
import Destinations from '../components/Destinations';

export default function FeaturedPage() {
  return (
    <motion.div
      className="featured-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── The Journey ── */}
      <header className="featured-page__head">
        <span className="featured-page__eyebrow">The Journey</span>
        <h1 className="featured-page__title">Featured Reel</h1>
        <p className="featured-page__sub">
          ✈︎ between countries · 🚄 within them — every city on this site, in order of arrival.
        </p>
      </header>

      <FlightMap />

      {/* ── Today's Reel ── */}
      <section className="featured-page__story">
        <header className="featured-page__story-head">
          <span className="featured-page__eyebrow">Selected work</span>
          <h2 className="featured-page__story-title">Today's Reel</h2>
          <p className="featured-page__story-hint">
            Space to pause · ← → or swipe to navigate · new picks every day
          </p>
        </header>

        <StoryReel />
      </section>

      {/* ── Destinations grid ── */}
      <section className="featured-page__cities">
        <Destinations />
      </section>
    </motion.div>
  );
}
