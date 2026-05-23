/**
 * BackToTopButton — floating circular button that returns the user to the top
 * of the page. Visibility is scroll-gated, so it only appears once the user
 * has scrolled enough to actually need it (pages with little content never
 * show it). Uses Lenis if available for smooth scroll, native scroll
 * otherwise (reduced-motion users get instant jump).
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLenis } from '../hooks/useLenis';

const SHOW_THRESHOLD = 600; // px scrolled before button appears

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const lenis = getLenis();

    const handle = (y) => setVisible(y > SHOW_THRESHOLD);

    if (lenis) {
      // Lenis emits its own scroll event with the current scroll value
      const onScroll = ({ scroll }) => handle(scroll);
      lenis.on('scroll', onScroll);
      // initial check
      handle(window.scrollY);
      return () => lenis.off('scroll', onScroll);
    }

    // Fallback (reduced-motion users — Lenis isn't booted)
    const onNative = () => handle(window.scrollY);
    window.addEventListener('scroll', onNative, { passive: true });
    handle(window.scrollY);
    return () => window.removeEventListener('scroll', onNative);
  }, []);

  const scrollToTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="back-to-top"
          className="back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.92 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <svg
            className="back-to-top__icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
