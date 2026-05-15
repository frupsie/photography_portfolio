/**
 * FeaturedPage — /featured route.
 * Houses the interactive globe + featured carousel + destinations grid
 * that used to live on the LandingPage. Linked from the Reel outro.
 */
import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import FeaturedCarousel from '../components/FeaturedReel';
import Destinations from '../components/Destinations';

const GlobeSection = lazy(() => import('../components/GlobeSection'));

export default function FeaturedPage() {
  return (
    <motion.div
      className="featured-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
    >
      <header className="featured-page__head">
        <span className="featured-page__eyebrow">Curated</span>
        <h1 className="featured-page__title">Featured Reel</h1>
        <p className="featured-page__sub">
          A handpicked set of frames and the cities behind them.
        </p>
      </header>

      <Suspense fallback={<div className="globe-section globe-section--loading" />}>
        <GlobeSection />
      </Suspense>

      <FeaturedCarousel />

      <Destinations />
    </motion.div>
  );
}
