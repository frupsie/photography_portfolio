import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePortfolioStats } from '../../hooks/usePortfolioStats';
import { useMatchMedia } from '../../hooks/useMatchMedia';
import { SOCIAL } from '../../data/social';
import { InstagramIcon } from '../icons/SocialIcons';

// ── Animated count-up ────────────────────────────────────────────────────────
// reduceMotion skips both the scroll-triggered delay and the tween: the
// final value renders immediately, same as every other section on this page
// under prefers-reduced-motion.
function CountUp({ to, duration = 1.4, suffix = '', reduceMotion = false }) {
  const ref    = useRef(null);
  const [val, setVal] = useState(reduceMotion ? to : 0);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  useEffect(() => {
    if (reduceMotion) { setVal(to); return; }
    if (!inView || to === 0) { setVal(to); return; }
    let startTs = null;
    const tick = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / (duration * 1000), 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, duration, reduceMotion]);

  return <span ref={ref}>{val}{suffix}</span>;
}

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

// reduceMotion=true renders content already in its resting state — no
// initial hidden state, no transition — instead of skipping only the
// timing. `initial={false}` is framer's own way to say "never animate the
// mount," not just "animate it instantly."
const fadeUp = (delay = 0, reduceMotion = false) =>
  reduceMotion
    ? { initial: false, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
      };

export default function AboutPage() {
  const stats = usePortfolioStats();
  // PRODUCT.md claims prefers-reduced-motion is respected sitewide; this
  // page was the one exception — ~15 cascading fade-ups plus three count-up
  // stats ran unconditionally. Same hook Home.jsx and PhotoLightbox already
  // use for the same check.
  const reduceMotion = useMatchMedia('(prefers-reduced-motion: reduce)');

  return (
    <motion.div
      className="ap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── HERO BAND ── */}
      <section className="ap-hero" aria-labelledby="ap-hero-heading">
        <motion.span className="ap-hero__eyebrow" {...fadeUp(0.05, reduceMotion)}>
          Singapore · Photographer
        </motion.span>
        <motion.h1 id="ap-hero-heading" className="ap-hero__name" {...fadeUp(0.12, reduceMotion)}>
          Jayden Ng
        </motion.h1>
        <motion.p className="ap-hero__tagline" {...fadeUp(0.2, reduceMotion)}>
          Chasing light across Asia, one frame at a time.
        </motion.p>
      </section>

      {/* ── ABOUT ── */}
      {/* No visible heading of its own — the bio/stats/EXIF/CTA block reads
          fine visually right under the hero, but that left it with no
          landmark label and, worse, no heading at all: heading-only
          navigation jumped straight from "Jayden Ng" (h1) to "The Kit"
          (h2), skipping three paragraphs, three stats, the EXIF strip, and
          both CTAs. The h2 below exists only for that navigation mode. */}
      <section className="ap-about" aria-labelledby="ap-about-heading">
        <h2 id="ap-about-heading" className="visually-hidden">About</h2>
        {/* One anchor portrait, plus two small supporting candids underneath.
            This isn't a gallery — that's what /gallery is for — so the
            candids stay quiet: no hover zoom, no lightbox, just texture. */}
        <motion.div className="ap-about__photo" {...fadeUp(0.16, reduceMotion)}>
          <img
            className="ap-about__portrait"
            src="/photos-web/about/about-portrait.jpg"
            alt="Jayden Ng, in a cap and glasses, standing beneath a sunlit stone archway in Kyoto"
            decoding="async"
          />
          <div className="ap-about__candids">
            {/* The portrait above is near the top of the fold and stays eager
                (no `loading`) so it isn't held back as an LCP candidate —
                same convention as the Home hero. These two sit below it and
                are secondary, so they're fair game to defer. */}
            <img
              src="/photos-thumb/about/about-candid-1.webp"
              alt="Jayden photographing his own reflection in a mirrored shop interior, camera raised"
              loading="lazy"
              decoding="async"
            />
            <img
              src="/photos-thumb/about/about-candid-2.webp"
              alt="Jayden standing on a wooden boardwalk beneath a tall tree-lined avenue"
              loading="lazy"
              decoding="async"
            />
          </div>
        </motion.div>

        <motion.div className="ap-about__body" {...fadeUp(0.22, reduceMotion)}>
          <p className="ap-bio">
            Based in <strong>Singapore</strong>, I travel across Asia with a camera
            and a curiosity for light, texture, and the quiet moments between the
            obvious shots.
          </p>
          <p className="ap-bio">
            My work spans street photography, landscapes, and architecture, always
            searching for the frame that captures a place's atmosphere rather than
            just its surface.
          </p>
          <p className="ap-bio">
            I'm still amazed, watching other photographers work, by what quality,
            framing, and timing can do in someone else's hands. The same three
            ingredients everyone has, used a hundred different ways. A camera is a
            strange kind of tool that way: technical enough to reward a lifetime of
            learning shutter speeds, apertures, glass, and simple enough that none
            of it matters the moment it becomes something else. A way to say what a
            feeling looks like. A way to hand someone a story without a single word
            attached to it.
          </p>

          {/* ── Big travel numbers ──────────────────────────────── */}
          <div className="ap-stats">
            <div className="ap-stat">
              <span className="ap-stat__num">
                <CountUp to={stats.cities} reduceMotion={reduceMotion} />
              </span>
              <span className="ap-stat__label">Cities</span>
            </div>
            <div className="ap-stat">
              <span className="ap-stat__num">
                <CountUp to={stats.countries} reduceMotion={reduceMotion} />
              </span>
              <span className="ap-stat__label">Countries</span>
            </div>
            <div className="ap-stat">
              <span className="ap-stat__num">
                <CountUp to={stats.photos} reduceMotion={reduceMotion} />
              </span>
              <span className="ap-stat__label">Photos</span>
            </div>
          </div>

          {/* ── EXIF / photographer strip ────────────────────────── */}
          <div className="ap-stats-exif">
            <div className="ap-stats-exif__item">
              <span className="ap-stats-exif__val">{stats.favFocal}</span>
              <span className="ap-stats-exif__label">Primary Focal</span>
            </div>
            <span className="ap-stats-exif__sep" aria-hidden>·</span>
            <div className="ap-stats-exif__item">
              <span className="ap-stats-exif__val">{stats.favAperture}</span>
              <span className="ap-stats-exif__label">Fav Aperture</span>
            </div>
            <span className="ap-stats-exif__sep" aria-hidden>·</span>
            <div className="ap-stats-exif__item">
              <span className="ap-stats-exif__val">{stats.cameras}</span>
              <span className="ap-stats-exif__label">Camera Bodies</span>
            </div>
          </div>
          {/* usePortfolioStats derives "Camera Bodies" from every distinct
              camera string in photo-meta.js — including two bodies (an
              iPhone 12, a Canon EOS R8) that appear on exactly one archived
              photo each and aren't part of the active kit below. Without
              this line the two numbers read as a contradiction on the one
              page built to prove range and consistency. */}
          <p className="ap-stats-exif__note">
            Reflects every camera across the full archive, including retired bodies.
          </p>

          {/* Contact is the primary action; Instagram is a lower-commitment
              second path for a visitor who wants more, less-curated work
              before deciding whether to reach out. */}
          <div className="ap-actions">
            <Link to="/contact" className="ap-contact-btn">
              Get in Touch
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"
                   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                   aria-hidden="true">
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </Link>
            {SOCIAL.instagram && (
              <a
                href={`https://instagram.com/${SOCIAL.instagram}`}
                className="ap-social-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon />
                Follow on Instagram
              </a>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── DIVIDER ── */}
      <motion.div className="ap-divider" {...fadeUp(0.1, reduceMotion)}>
        <span className="ap-divider__label">Equipment</span>
      </motion.div>

      {/* ── GEAR ── */}
      <section className="ap-gear" aria-labelledby="ap-gear-heading">
        <motion.h2 id="ap-gear-heading" className="ap-gear__heading" {...fadeUp(0.1, reduceMotion)}>
          The Kit
        </motion.h2>

        <div className="ap-gear__rows">
          {gear.map(({ category, items }, i) => (
            <motion.div
              key={category}
              className="ap-gear__row"
              {...fadeUp(0.12 + i * 0.07, reduceMotion)}
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
      <motion.section className="ap-workflow" aria-labelledby="ap-workflow-heading" {...fadeUp(0.1, reduceMotion)}>
        <h2 id="ap-workflow-heading" className="ap-workflow__heading">Workflow</h2>
        <div className="ap-workflow__steps">
          {workflow.map(({ num, label }, i) => (
            <div key={num} className="ap-workflow__step">
              <span className="ap-workflow__num">{num}</span>
              <span className="ap-workflow__label">{label}</span>
              {i < workflow.length - 1 && (
                <svg className="ap-workflow__arrow" viewBox="0 0 24 8" fill="none" aria-hidden="true">
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
