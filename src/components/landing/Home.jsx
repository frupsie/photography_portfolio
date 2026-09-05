/**
 * Home - the homepage.
 *
 * Four sections, four layout families: full-bleed opening, sticky typographic
 * index with a photographic reveal, pinned horizontal pan of the favourites
 * pool, full-width closer.
 *
 * Locked decisions:
 *   Theme      one dark theme, no section inverts
 *   Accent     one muted gold (binding, PRODUCT.md)
 *   Radius     0 everywhere
 *   Eyebrows   zero
 *   Em-dashes  zero in any user-visible string
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cities, countriesByYear } from '../../data/cities';
import { featured } from '../../data/featured';
import { thumbSrc } from '../../utils/thumb';
import { useMatchMedia } from '../../hooks/useMatchMedia';
import PhotoLightbox from './PhotoLightbox';
import './Home.css';

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

const OPENING = WITH_HERO.find((c) => c.slug === 'hong-kong') ?? WITH_HERO[0];

// Spell small numbers; the sentence reads better and avoids a metric-looking digit.
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const spell = (n) => WORDS[n] ?? String(n);
// Sentence case, for a spelled number opening a sentence.
const spellCap = (n) => {
  const w = spell(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

// Homepage-only picture overrides. cities.js stays the single source of truth,
// so a city whose hero does not suit this layout is corrected here rather than
// there. Guangzhou's hero is the one portrait among twelve
// landscape heroes, and both the index plate and the frame grid are landscape.
const PLATE_OVERRIDE = {
  guangzhou: '/photos-web/guangzhou/_MG_7643.JPG',
};
const plateSrc = (c) => PLATE_OVERRIDE[c.slug] ?? c.heroImage;

// featured.js doesn't carry alt text of its own; cities.js already has the
// real, specific alt for every photo (see the sitewide alt-text pass).
// Looked up by src rather than hand-kept twice, same reasoning as every
// other cities.js-derived lookup in this file.
const ALT_BY_SRC = Object.fromEntries(
  cities.flatMap((c) => (c.photos ?? []).map((p) => (
    typeof p === 'string' ? [p, ''] : [p.src, p.alt ?? '']
  ))),
);

// Frames used to link out to each photo's city gallery; clicking one now
// opens it in place instead (PhotoLightbox), so a visitor mid-way through
// the curated favourites strip isn't pulled off the homepage to see a
// bigger version. Shaped once, at module scope, into what PhotoLightbox
// expects — featured.js itself stays untouched.
const FEATURED_PHOTOS = featured.map((f) => ({
  src: f.photo,
  alt: ALT_BY_SRC[f.photo] || `${f.city}, ${f.country}`,
  city: f.city,
  country: f.country,
}));

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
      gsap.from('.home-open__img', {
        scale: 1.08,
        duration: 1.6,
        ease: 'expo.out',
      });
      gsap.from('.home-open__line > *', {
        yPercent: 115,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.08,
        delay: 0.15,
      });
      // Parallax: the image drifts slower than the page, holding the reader a
      // beat longer on the first frame.
      gsap.to('.home-open__img', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="home-open" ref={root}>
      <div className="home-open__media">
        <img
          className="home-open__img"
          src={OPENING.heroImage}
          alt={`${OPENING.name}, ${OPENING.country}`}
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="home-open__type">
        <h1 className="home-open__name">
          <span className="home-open__line"><span>Jayden</span></span>
          <span className="home-open__line"><span>Ng</span></span>
        </h1>
        <p className="home-open__sub">
          Photographs from {spell(cities.length)} cities across Japan, China and South Korea.
        </p>
        <Link className="home-cta" to="/gallery">See the gallery</Link>
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
      gsap.utils.toArray('.home-index__group').forEach((g) => {
        gsap.from(g.querySelectorAll('.home-index__row'), {
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
    <section className="home-index" ref={root}>
      <div className="home-index__list">
        <h2 className="home-index__title">Where the work comes from</h2>

        {countriesByYear.map((country) => (
          <div className="home-index__group" key={country}>
            <h3 className="home-index__country">{country}</h3>
            <ul>
              {BY_COUNTRY[country].map((c) => (
                <li key={c.slug}>
                  <Link
                    className={`home-index__row${active === c.slug ? ' is-active' : ''}`}
                    to={`/city/${c.slug}`}
                    onMouseEnter={() => setActive(c.slug)}
                    onFocus={() => setActive(c.slug)}
                  >
                    {/* Touch has no hover, so the sticky plate's "names summon
                        photographs" idea cannot fire there. Each row carries its
                        own frame instead; the plate is hidden below 900px. Same
                        URLs as the plate, so no extra downloads. */}
                    <span
                      className={`home-index__thumb${c.heroImage ? '' : ' home-index__thumb--empty'}`}
                      aria-hidden="true"
                    >
                      {c.heroImage && (
                        <img src={thumbSrc(plateSrc(c))} alt="" loading="lazy" decoding="async" />
                      )}
                    </span>
                    <span className="home-index__city">{c.name}</span>
                    <span className="home-index__year">{c.year}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Decorative in the strict sense: the same photograph is reachable by
          activating the row, so it is hidden from assistive tech. */}
      <div className="home-index__platewrap" aria-hidden="true">
        <div className="home-index__plate">
        {WITH_HERO.map((c) => (
          <img
            key={c.slug}
            src={thumbSrc(plateSrc(c))}
            alt=""
            loading="lazy"
            decoding="async"
            className={`home-index__plate-img${active === c.slug ? ' is-active' : ''}`}
          />
        ))}
          {/* Empty state: a city can be in the log before its photographs are
              imported (Hangzhou today). Without this the plate goes blank
              under a caption naming the city, which reads as a broken image. */}
          {activeCity && !activeCity.heroImage && (
            <span className="home-index__plate-empty">
              Photographs from {activeCity.name} are not online yet.
            </span>
          )}
        </div>
        <span className="home-index__plate-cap">
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
  const progressFill = useRef(null);
  const narrow = useMatchMedia('(max-width: 900px)');
  const reduce = useMatchMedia('(prefers-reduced-motion: reduce)');

  const [lightboxIndex, setLightboxIndex] = useState(null);
  // PhotoLightbox manages focus inside itself but, per its own doc comment,
  // leaves restoring focus on close to the caller — GalleryPage does this
  // via navigate(-1) since it opens through the URL; this is plain local
  // state, so the trigger button itself is remembered directly instead.
  const lastFocusedRef = useRef(null);

  const openLightbox = (i, e) => {
    lastFocusedRef.current = e.currentTarget;
    setLightboxIndex(i);
  };
  const closeLightbox = () => {
    setLightboxIndex(null);
    lastFocusedRef.current?.focus();
  };
  const goPrev = () => setLightboxIndex((i) => (i - 1 + FEATURED_PHOTOS.length) % FEATURED_PHOTOS.length);
  const goNext = () => setLightboxIndex((i) => (i + 1) % FEATURED_PHOTOS.length);

  useEffect(() => {
    const trackEl = track.current;
    if (!wrap.current || !trackEl) return;

    // Touch and reduced-motion get a real scrollable strip instead of the
    // pinned pan. Hijacking the scroll on a phone is hostile.
    //
    // The strip's native scrollbar is hidden (CSS) for a cleaner look, so the
    // gold fill bar below the track is the only progress cue left — without
    // it a reader has no way to tell there are nine photographs here, not
    // three, or how far through them they are.
    if (reduce || narrow) {
      const fillEl = progressFill.current;
      if (!fillEl) return;

      const update = () => {
        const max = trackEl.scrollWidth - trackEl.clientWidth;
        fillEl.style.transform = `scaleX(${max > 0 ? trackEl.scrollLeft / max : 0})`;
      };
      update();

      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { update(); ticking = false; });
      };
      trackEl.addEventListener('scroll', onScroll, { passive: true });

      // Frame widths are only final once each image reports its natural
      // ratio, and scrollWidth depends on those widths. Recompute after.
      const imgs = [...trackEl.querySelectorAll('img')];
      let alive = true;
      Promise.all(
        imgs.map((img) => (img.complete ? null : new Promise((res) => {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
        }))),
      ).then(() => { if (alive) update(); });

      return () => {
        alive = false;
        trackEl.removeEventListener('scroll', onScroll);
      };
    }

    let st = null;
    let ctx = null;
    let alive = true;
    let removeFocusIn = () => {};

    // Frame widths — and so the pin's whole scroll distance — are only
    // correct once every image has actually loaded (no width/height
    // attributes are set, so the browser has no aspect ratio to go on
    // before then). The previous approach created the ScrollTrigger
    // immediately with whatever (too-small) distance existed at that
    // instant, then corrected it later via ScrollTrigger.refresh() once
    // images loaded. On a fresh, uncached visit that correction could land
    // while a reader was already mid-scroll into the pinned section — a
    // refresh mid-scrub recalculates the current scroll progress against
    // the new distance in one step, which reads as a visible rubberband
    // jerk. (Reported: happens on first load, not on refresh — exactly the
    // signature of the images being cache-instant the second time.)
    // Deferring creation until images are ready removes the race instead
    // of patching around it: the pin never exists with a wrong distance,
    // so there's nothing to correct out from under an active scroll.
    const setup = () => {
      if (!alive) return;
      ctx = gsap.context(() => {
        const distance = () => Math.max(0, track.current.scrollWidth - window.innerWidth);
        const tween = gsap.to(track.current, {
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
        st = tween.scrollTrigger;
      }, wrap);

      // Keyboard focus has to drive the pan, not fight it.
      //
      // Tabbing to an off-screen frame makes the browser scroll it into view. It
      // cannot move the track, which GSAP positions by transform, so it scrolls
      // the section box instead: overflow:hidden blocks a scrollbar but not
      // programmatic scrolling. The section ends up displaced by up to 2300px
      // with no way for the reader to undo it, while GSAP still believes the pan
      // is where it left it.
      //
      // So: undo the container scroll, and convert the focused frame's position
      // along the track into the page scroll that brings it into view. The pan
      // then lands on that frame as if the reader had scrolled there.
      const onFocusIn = (e) => {
        const frame = e.target.closest?.('.home-frame');
        if (!frame || !st) return;
        const undo = () => { if (wrap.current) wrap.current.scrollLeft = 0; };
        undo();
        requestAnimationFrame(undo);      // again after the browser's own attempt
        const margin = window.innerWidth * 0.06;   // matches the track gutter
        const target = st.start + Math.max(0, frame.offsetLeft - margin);
        window.scrollTo({ top: Math.min(target, st.end), behavior: 'auto' });
      };
      trackEl.addEventListener('focusin', onFocusIn);
      removeFocusIn = () => trackEl.removeEventListener('focusin', onFocusIn);
    };

    const imgs = [...trackEl.querySelectorAll('img')];
    if (imgs.every((img) => img.complete)) {
      setup();
    } else {
      Promise.all(
        imgs.map((img) => (img.complete ? null : new Promise((res) => {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
        }))),
      ).then(setup);
    }

    return () => {
      alive = false;
      removeFocusIn();
      ctx?.revert();
    };
    // Re-run (cleanup then re-setup) whenever the breakpoint or motion
    // preference actually changes, not just once at mount.
  }, [narrow, reduce]);

  return (
    <section className="home-frames" ref={wrap}>
      <div className="home-frames__head">
        <h2 className="home-frames__title">
          {spellCap(featured.length)} favourites from {TOTAL_FRAMES} photographs.
        </h2>
      </div>

      <div className="home-frames__track" ref={track}>
        {featured.map((f, i) => (
          <button
            type="button"
            className={`home-frame home-frame--${STRIP_SIZE[i % STRIP_SIZE.length]}`}
            style={{ '--drop': `${STRIP_DROP[i % STRIP_DROP.length]}vh` }}
            onClick={(e) => openLightbox(i, e)}
            aria-label={FEATURED_PHOTOS[i].alt}
            key={f.photo}
          >
            <span className="home-frame__plate">
              {/* alt is empty by design: the aria-label above already names
                  the photograph, and it is inside the same button, so
                  repeating it here would make screen readers say it twice. */}
              {/* Not lazy: the pinned pan's scroll distance depends on every
                  frame's real width, which depends on these having loaded
                  (see the effect above) — lazy-loading them left that
                  correction racing a reader's actual scroll on a first,
                  uncached visit. Eager gives it a two-section head start. */}
              <img src={thumbSrc(f.photo)} alt="" decoding="async" />
            </span>
            <span className="home-frame__cap">{f.city}</span>
          </button>
        ))}
      </div>

      {/* Touch/reduced-motion only (CSS-hidden on desktop): the swipeable
          strip's native scrollbar is hidden for a cleaner look, so this is
          the only cue that there are more photographs than fit on screen. */}
      <div className="home-frames__progress" aria-hidden="true">
        <div className="home-frames__progress-fill" ref={progressFill} />
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={FEATURED_PHOTOS}
            index={lightboxIndex}
            onClose={closeLightbox}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ── 4. Closer ─────────────────────────────────────────────────────────────
   Layout family: full-width typographic statement. One CTA, and its intent
   (contact) does not duplicate the hero's (portfolio). */
function Closer() {
  return (
    <section className="home-closer">
      <p className="home-closer__lead">
        The archive grows after every trip. Hangzhou is next.
      </p>
      <Link className="home-cta home-cta--lg" to="/contact">Get in touch</Link>
    </section>
  );
}

export default function Home() {
  // div, not main: App.jsx owns the single <main> landmark for every route,
  // so declaring one here would nest two landmarks.
  //
  // Also, deliberately, no motion.div page-transition wrapper — every other
  // route shares one identical fade (see the shared reduceMotion-gated
  // opacity transition on About/Contact/Gallery/City/NotFound's own root).
  // Home already has its own, more elaborate entrance (Opening's GSAP
  // image-scale and headline reveal) the instant it mounts; wrapping that
  // in a second, generic fade would either double up on top of it or fight
  // it, not add anything a visitor would read as intentional.
  return (
    <div className="home">
      <Opening />
      <Index />
      <Frames />
      <Closer />
    </div>
  );
}
