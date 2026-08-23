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
import { featured } from '../../data/featured';
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
// Sentence case, for a spelled number opening a sentence.
const spellCap = (n) => {
  const w = spell(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

const thumb = (src) => src.replace('/photos-web/', '/photos-thumb/').replace(/\.(jpe?g|JPE?G)$/, '.webp');

// Sandbox-only picture overrides. cities.js stays the single source of truth for
// the live site, so a city whose hero does not suit this layout is corrected
// here rather than there. Guangzhou's hero is the one portrait among twelve
// landscape heroes, and both the index plate and the frame grid are landscape.
const PLATE_OVERRIDE = {
  guangzhou: '/photos-web/guangzhou/_MG_7643.JPG',
};
const plateSrc = (c) => PLATE_OVERRIDE[c.slug] ?? c.heroImage;

// featured.js stores a city name, not a slug. Derive the link from cities.js
// rather than adding a second hand-kept mapping.
const SLUG_BY_NAME = Object.fromEntries(cities.map((c) => [c.name, c.slug]));

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
            src={thumb(plateSrc(c))}
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
   Layout family: pinned horizontal pan. Scrolling down moves the strip
   sideways, so the reader travels the selection instead of scanning a static
   block. That is the justification for the motion.

   Source is featured.js, the curated favourites pool, not one photograph per
   city. A city-derived strip is as long as the travel list and says nothing
   about which frames are actually good.

   Orientation-agnostic by construction: each frame fixes a HEIGHT and lets
   width follow the image's natural ratio. Portraits come out narrow,
   landscapes wide, and nothing is ever cropped. Today's pool is all 3:2, but
   adding a vertical shot needs no code change. */
const STRIP_SIZE = ['lg', 'sm', 'md', 'sm', 'lg', 'md'];
const STRIP_DROP = [0, 9, -7, 11, 0, -9];   // vh, breaks the shared baseline

function Frames() {
  const wrap = useRef(null);
  const track = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = window.matchMedia('(max-width: 900px)').matches;
    // Touch and reduced-motion get a real scrollable strip instead. Hijacking
    // the scroll on a phone is hostile, and the CSS fallback already works.
    if (reduce || narrow || !wrap.current || !track.current) return;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.current.scrollWidth - window.innerWidth);
      gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: wrap.current,
          start: 'top top',              // pin the moment the section lands
          end: () => `+=${distance()}`,  // scroll length equals the travel
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,     // recompute on resize and font load
        },
      });
    }, wrap);

    // Frame widths are only known once each image reports its natural ratio,
    // and those widths are what set the pan distance. Refresh after they land.
    const imgs = [...track.current.querySelectorAll('img')];
    let alive = true;
    Promise.all(
      imgs.map((img) => (img.complete ? null : new Promise((res) => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      }))),
    ).then(() => { if (alive) ScrollTrigger.refresh(); });

    return () => { alive = false; ctx.revert(); };
  }, []);

  return (
    <section className="hv2-frames" ref={wrap}>
      <div className="hv2-frames__head">
        <h2 className="hv2-frames__title">
          {spellCap(featured.length)} favourites from {TOTAL_FRAMES} photographs.
        </h2>
      </div>

      <div className="hv2-frames__track" ref={track}>
        {featured.map((f, i) => (
          <Link
            className={`hv2-frame hv2-frame--${STRIP_SIZE[i % STRIP_SIZE.length]}`}
            style={{ '--drop': `${STRIP_DROP[i % STRIP_DROP.length]}vh` }}
            to={`/city/${SLUG_BY_NAME[f.city] ?? ''}`}
            key={f.photo}
          >
            <span className="hv2-frame__plate">
              {/* alt is empty by design: the visible caption below names the
                  photograph, and it is inside the same link, so repeating it
                  here would make screen readers say the city twice. */}
              <img src={thumb(f.photo)} alt="" loading="lazy" decoding="async" />
            </span>
            <span className="hv2-frame__cap">{f.city}</span>
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
