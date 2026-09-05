import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMatchMedia } from '../../hooks/useMatchMedia';

/**
 * NotFound — catch-all route.
 *
 * Reuses the `content-page` layout from ContactPage so it inherits the site's
 * spacing and type without new CSS. Framed in the camera vernacular used
 * elsewhere (EXIF cards, the viewfinder intro) rather than a generic "404".
 */
export default function NotFound() {
  // Was the one page-transition left ungated.
  const reduceMotion = useMatchMedia('(prefers-reduced-motion: reduce)');

  return (
    <motion.div
      className="content-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5 }}
    >
      <div className="content-page__inner content-page__inner--narrow">
        <span className="content-page__label">Error 404</span>
        <h1 className="content-page__title">Out of frame</h1>
        <p className="content-page__sub">
          That page doesn&rsquo;t exist. It may have moved, or the link may be
          incomplete.
        </p>

        <div className="notfound__actions">
          <Link to="/" className="notfound__link notfound__link--primary">
            Back to home
          </Link>
          <Link to="/gallery" className="notfound__link">
            Browse the gallery
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
