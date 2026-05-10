import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const gear = [
  {
    category: 'Body',
    items: [
      { name: 'Canon EOS RP', note: 'Primary shooter' },
      { name: 'Fujifilm X-T30 II', note: 'Street & travel companion' },
      { name: 'iPhone 16 Pro Max', note: 'Always in pocket' },
    ],
  },
  {
    category: 'Lenses',
    items: [
      { name: 'Sigma 24–105mm f/4 DG OS HSM Art (EF)', note: 'Primary zoom for street, travel & landscapes' },
      { name: 'Canon RF 50mm f/1.8 STM', note: 'Portrait & low light prime' },
      { name: 'Fujifilm XF 23mm f/2 R WR', note: 'Street & everyday prime on X-T30 II' },
    ],
  },
  {
    category: 'Accessories',
    items: [
      { name: 'Kase Variable ND & CPL 1.5–8 Stop 82mm', note: 'Long exposures & glare control' },
      { name: 'Kase Black Mist 1/4 86mm', note: 'Soft glow & highlight diffusion' },
      { name: 'PGYTECH OneGo Solo V2 6L', note: 'Camera bag for daily carry' },
    ],
  },
  {
    category: 'Software',
    items: [
      { name: 'Adobe Lightroom', note: 'Culling, editing & cataloguing' },
      { name: 'Adobe Photoshop', note: 'Compositing & retouching' },
    ],
  },
];

const workflow = [
  { num: '01', label: 'Shoot RAW' },
  { num: '02', label: 'Cull' },
  { num: '03', label: 'Grade' },
  { num: '04', label: 'Export' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

export default function AboutPage() {
  return (
    <motion.div
      className="ap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── HERO BAND ── */}
      <section className="ap-hero">
        <motion.span className="ap-hero__eyebrow" {...fadeUp(0.05)}>
          Singapore · Photographer
        </motion.span>
        <motion.h1 className="ap-hero__name" {...fadeUp(0.12)}>
          Jayden Ng
        </motion.h1>
        <motion.p className="ap-hero__tagline" {...fadeUp(0.2)}>
          Chasing light across Asia — one frame at a time.
        </motion.p>
      </section>

      {/* ── ABOUT ── */}
      <section className="ap-about">
        <motion.div className="ap-about__photo" {...fadeUp(0.15)}>
          <div className="ap-about__photo-inner">
            <span>Portrait</span>
          </div>
        </motion.div>

        <motion.div className="ap-about__body" {...fadeUp(0.22)}>
          <p className="ap-bio">
            Based in <strong>Singapore</strong>, I travel across Asia with a camera
            and a curiosity for light, texture, and the quiet moments between the
            obvious shots.
          </p>
          <p className="ap-bio">
            My work spans street photography, landscapes, and architecture — always
            searching for the frame that captures a place's atmosphere rather than
            just its surface.
          </p>
          <p className="ap-bio">
            [Replace this with your own story.]
          </p>

          <div className="ap-stats">
            <div className="ap-stat">
              <span className="ap-stat__num">11</span>
              <span className="ap-stat__label">Cities</span>
            </div>
            <div className="ap-stat">
              <span className="ap-stat__num">3</span>
              <span className="ap-stat__label">Countries</span>
            </div>
            <div className="ap-stat">
              <span className="ap-stat__num">∞</span>
              <span className="ap-stat__label">Frames</span>
            </div>
          </div>

          <Link to="/contact" className="ap-contact-btn">
            Get in Touch
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </Link>
        </motion.div>
      </section>

      {/* ── DIVIDER ── */}
      <motion.div className="ap-divider" {...fadeUp(0.1)}>
        <span className="ap-divider__label">Equipment</span>
      </motion.div>

      {/* ── GEAR ── */}
      <section className="ap-gear">
        <motion.h2 className="ap-gear__heading" {...fadeUp(0.1)}>
          The Kit
        </motion.h2>

        <div className="ap-gear__rows">
          {gear.map(({ category, items }, i) => (
            <motion.div
              key={category}
              className="ap-gear__row"
              {...fadeUp(0.12 + i * 0.07)}
            >
              <span className="ap-gear__cat">{category}</span>
              <ul className="ap-gear__items">
                {items.map(({ name, note }) => (
                  <li key={name} className="ap-gear__item">
                    <span className="ap-gear__item-name">{name}</span>
                    {note && <span className="ap-gear__item-note">{note}</span>}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <motion.section className="ap-workflow" {...fadeUp(0.1)}>
        <h2 className="ap-workflow__heading">Workflow</h2>
        <div className="ap-workflow__steps">
          {workflow.map(({ num, label }, i) => (
            <div key={num} className="ap-workflow__step">
              <span className="ap-workflow__num">{num}</span>
              <span className="ap-workflow__label">{label}</span>
              {i < workflow.length - 1 && (
                <svg className="ap-workflow__arrow" viewBox="0 0 24 8" fill="none">
                  <path d="M0 4h20M16 1l4 3-4 3" stroke="currentColor"
                        strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
