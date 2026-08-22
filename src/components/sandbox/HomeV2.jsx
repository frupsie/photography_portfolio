/**
 * HomeV2 - staged homepage overhaul. Viewable at /sandbox/home.
 *
 * Built with the design-taste-frontend skill in "Redesign - Overhaul" mode:
 * content, IA and routes are preserved, the four-act cinematic concept is not.
 * Live Reel.jsx and its four acts are untouched.
 *
 * Dials: DESIGN_VARIANCE 9 / MOTION_INTENSITY 9 / VISUAL_DENSITY 2
 *
 * Locked decisions (audited in the pre-flight before shipping):
 *   Theme      one dark theme, no section inverts
 *   Accent     one muted gold, used identically everywhere (binding, PRODUCT.md)
 *   Radius     0 everywhere. An archive has square corners.
 *   Eyebrows   zero
 *   Em-dashes  zero in any user-visible string
 *
 * What the overhaul drops from the live homepage, and why:
 *   - The "cities / countries / frames" stat row. Three numbers with small caps
 *     labels is the hero-metric template; the counts now live inside a sentence.
 *   - The "Scroll" cue. If the reader has not scrolled, they are in the hero.
 *   - The 01..12 numbering on contact-sheet frames. Countable things do not
 *     need counting.
 *   - Playfair Display + Inter, the default "elegant portfolio" pairing.
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cities } from '../../data/cities';
import './HomeV2.css';

gsap.registerPlugin(ScrollTrigger);

// Everything below is derived from cities.js. Nothing here is hand-maintained.
// See CLAUDE.md: a second hand-kept list silently dropped a city once already.
const WITH_HERO = cities.filter((c) => c.heroImage);

const BY_COUNTRY = cities.reduce((acc, c) => {
  (acc[c.country] ??= []).push(c);
  return acc;
}, {});

const TOTAL_FRAMES = (() => {
  const seen = new Set();
  cities.forEach((c) => {
    if (c.heroImage && !c.heroImage.includes('placeholder')) seen.add(c.heroImage);
    (c.photos ?? []).forEach((p) => seen.add(typeof p === 'string' ? p : p.src));
  });
  return seen.size;
})();

const COUNTRY_ORDER = ['Japan', 'China', 'South Korea'];
const OPENING = WITH_HERO.find((c) => c.slug === 'kyoto') ?? WITH_HERO[0];

// Spell small numbers; the sentence reads better and avoids a metric-looking digit.
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const spell = (n) => WORDS[n] ?? String(n);

const thumb = (src) => src.replace('/photos-web/', '/photos-thumb/').replace(/\.(jpe?g|JPE?G)$/, '.webp');

/** The display face is loaded from the sandbox only, so live pages are unaffected. */
function useSandboxFonts() {
  useEffect(() => {
    const id = 'hv2-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Archivo:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);
}

/* ── 1. Opening frame ──────────────────────────────────────────────────────
   Layout family: full-bleed photograph with the type anchored off-centre.
   Anti-centre per 4.3 (VARIANCE 9). Four text elements maximum, and it uses
   three: name, one sentence, one CTA. */
function Opening() {
  const root = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      // Motivation: the photograph settles as the reader arrives, so the frame
      // reads as something being looked at rather than a background.
      gsap.from('.hv2-open__img', {
        scale: 1.08,
        duration: 1.6,
        ease: 'expo.out',
      });
      gsap.from('.hv2-open__line > *', {
        yPercent: 115,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.08,
        delay: 0.15,
      });
      // Parallax: the image drifts slower than the page, holding the reader a
      // beat longer on the first frame.
      gsap.to('.hv2-open__img', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hv2-open" ref={root}>
      <div className="hv2-open__media">
        <img
          className="hv2-open__img"
          src={OPENING.heroImage}
          alt={`${OPENING.name}, ${OPENING.country}`}
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="hv2-open__type">
        <h1 className="hv2-open__name">
          <span className="hv2-open__line"><span>Jayden</span></span>
          <span className="hv2-open__line"><span>Ng</span></span>
        </h1>
        <p className="hv2-open__sub">
          Photographs from {spell(cities.length)} cities across Japan, China and South Korea.
        </p>
        <Link className="hv2-cta" to="/gallery">See the gallery</Link>
      </div>
    </section>
  );
}

/* ── 2. The index ──────────────────────────────────────────────────────────
   Layout family: sticky typographic index paired with a photographic reveal.
   Long list handled per 4.9: grouped into three country clusters rather than
   thirteen hairline-separated rows. */
function Index() {
  const root = useRef(null);
  const [active, setActive] = useState(OPENING.slug);
  const activeCity = useMemo(() => cities.find((c) => c.slug === active), [active]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      // Motivation: each cluster arrives as the reader reaches it, so the index
      // builds in reading order instead of appearing pre-assembled.
      gsap.utils.toArray('.hv2-index__group').forEach((g) => {
        gsap.from(g.querySelectorAll('.hv2-index__row'), {
          opacity: 0,
          y: 18,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.05,
          scrollTrigger: { trigger: g, start: 'top 78%' },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hv2-index" ref={root}>
      <div className="hv2-index__list">
        <h2 className="hv2-index__title">Where the work comes from</h2>

        {COUNTRY_ORDER.filter((c) => BY_COUNTRY[c]).map((country) => (
          <div className="hv2-index__group" key={country}>
            <h3 className="hv2-index__country">{country}</h3>
            <ul>
              {BY_COUNTRY[country].map((c) => (
                <li key={c.slug}>
                  <Link
                    className={`hv2-index__row${active === c.slug ? ' is-active' : ''}`}
                    to={`/city/${c.slug}`}
                    onMouseEnter={() => setActive(c.slug)}
                    onFocus={() => setActive(c.slug)}
                  >
                    <span className="hv2-index__city">{c.name}</span>
                    <span className="hv2-index__year">{c.year}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Decorative in the strict sense: the same photograph is reachable by
          activating the row, so it is hidden from assistive tech. */}
      <div className="hv2-index__platewrap" aria-hidden="true">
        <div className="hv2-index__plate">
        {WITH_HERO.map((c) => (
          <img
            key={c.slug}
            src={thumb(c.heroImage)}
            alt=""
            loading="lazy"
            decoding="async"
            className={`hv2-index__plate-img${active === c.slug ? ' is-active' : ''}`}
          />
        ))}
          {/* Empty state: a city can be in the log before its photographs are
              imported (Hangzhou today). Without this the plate goes blank
              under a caption naming the city, which reads as a broken image. */}
          {activeCity && !activeCity.heroImage && (
            <span className="hv2-index__plate-empty">
              Photographs from {activeCity.name} are not online yet.
            </span>
          )}
        </div>
        <span className="hv2-index__plate-cap">
          {activeCity ? `${activeCity.name}, ${activeCity.country}` : ''}
        </span>
      </div>
    </section>
  );
}

/* ── 3. Frames ─────────────────────────────────────────────────────────────
   Layout family: asymmetric editorial grid. Explicitly not three equal cards
   (9.C) and not a zigzag of image/text splits (4.7). Cell count matches the
   content exactly, so there is no empty tile. */
const FRAME_PLAN = ['tall', 'wide', 'small', 'small', 'tall', 'wide'];

function Frames() {
  const root = useRef(null);
  const picks = WITH_HERO.filter((c) => c.slug !== OPENING.slug).slice(0, FRAME_PLAN.length);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      // Motivation: reveals the frame the way a print appears in a tray, and
      // gives the grid a reading direction it would not otherwise have.
      gsap.utils.toArray('.hv2-frame').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.9,
          ease: 'expo.out',
          delay: (i % 2) * 0.08,
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hv2-frames" ref={root}>
      <h2 className="hv2-frames__title">
        {TOTAL_FRAMES} photographs, kept in order of arrival.
      </h2>

      <div className="hv2-frames__grid">
        {picks.map((c, i) => (
          <Link className={`hv2-frame hv2-frame--${FRAME_PLAN[i]}`} to={`/city/${c.slug}`} key={c.slug}>
            <span className="hv2-frame__plate">
              {/* alt is empty by design: the visible caption below names the
                  photograph, and it is inside the same link, so repeating it
                  here would make screen readers say the city twice. */}
              <img src={thumb(c.heroImage)} alt="" loading="lazy" decoding="async" />
            </span>
            <span className="hv2-frame__cap">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── 4. Closer ─────────────────────────────────────────────────────────────
   Layout family: full-width typographic statement. One CTA, and its intent
   (contact) does not duplicate the hero's (portfolio). */
function Closer() {
  return (
    <section className="hv2-closer">
      <p className="hv2-closer__lead">
        The archive grows after every trip. Hangzhou is next.
      </p>
      <Link className="hv2-cta hv2-cta--lg" to="/contact">Get in touch</Link>
    </section>
  );
}

export default function HomeV2() {
  useSandboxFonts();
  return (
    <main className="hv2">
      <Opening />
      <Index />
      <Frames />
      <Closer />
    </main>
  );
}
