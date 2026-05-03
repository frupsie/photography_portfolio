import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <motion.div
      className="content-page"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="content-page__inner">
        <span className="content-page__label">About</span>
        <h1 className="content-page__title">The Photographer</h1>

        <div className="about-grid">
          <div className="about-grid__photo">
            <div className="about-grid__photo-placeholder">
              <span>Your Portrait</span>
            </div>
          </div>

          <div className="about-grid__text">
            <p className="about-text">
              Based in <strong>Singapore</strong>, I travel across Asia with a camera
              and a curiosity for light, texture, and the quiet moments between the
              obvious shots.
            </p>
            <p className="about-text">
              My work spans street photography, landscapes, and architecture — always
              searching for the frame that captures a place's atmosphere rather than
              just its surface.
            </p>
            <p className="about-text">
              [Replace this with your own story.]
            </p>

            <div className="about-stats">
              <div className="about-stats__item">
                <span className="about-stats__num">11</span>
                <span className="about-stats__label">Cities</span>
              </div>
              <div className="about-stats__item">
                <span className="about-stats__num">3</span>
                <span className="about-stats__label">Countries</span>
              </div>
              <div className="about-stats__item">
                <span className="about-stats__num">∞</span>
                <span className="about-stats__label">Frames</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
