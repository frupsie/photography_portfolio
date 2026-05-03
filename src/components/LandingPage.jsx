import { motion } from 'framer-motion';
import { cities } from '../data/cities';
import CardDeck from './CardDeck';

export default function LandingPage() {
  return (
    <div className="showcase">

      {/* ── Hero ── */}
      <section className="showcase__hero">
        <div className="showcase__hero-content">
          <motion.p
            className="showcase__tagline"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Photography by
          </motion.p>
          <motion.h1
            className="showcase__name"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Jayden Ng
          </motion.h1>
          <motion.p
            className="showcase__sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Travels across Asia — one frame at a time
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="showcase__scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.5 }}
        >
          <span className="showcase__scroll-label">Scroll Down</span>
          <span className="showcase__scroll-line" />
        </motion.div>

        {/* Decorative meta */}
        <motion.div
          className="showcase__hero-meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.0 }}
        >
          <span>3 Countries</span>
          <span className="showcase__hero-divider" />
          <span>{cities.length} Cities</span>
        </motion.div>
      </section>

      {/* ── Scroll-locked card deck ── */}
      <CardDeck />

    </div>
  );
}
