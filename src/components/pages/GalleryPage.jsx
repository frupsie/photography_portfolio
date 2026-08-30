import { useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cities } from '../../data/cities';
import { thumbSrc } from '../../utils/thumb';
import PhotoLightbox from '../landing/PhotoLightbox';

// ── Derived data ──────────────────────────────────────────────────────────────

const countries = [...new Set(cities.map(c => c.country))];

// Build a flat photo list from every city.
// Deduped by `src`: a hero is often also the first entry in photos[].
function buildPhotoList() {
  const list = [];
  const seen = new Set();
  const push = (src, orientation, city, alt) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    // alt carried through from cities.js. It was being dropped here, so every
    // grid image announced only its city name even where a real description
    // existed; CityPage was already using photo.alt correctly.
    // year rides along too, for the scroll dividers below — real capture
    // data, not a decorative label.
    list.push({ src, city: city.name, country: city.country, slug: city.slug, year: city.year, orientation, alt });
  };

  cities.forEach(city => {
    if (city.heroImage && !city.heroImage.includes('placeholder')) {
      // The hero file usually appears in city.photos too, where it carries a
      // real description. Because the hero is pushed first and `seen` dedupes
      // by src, pushing it without that alt made the described version
      // unreachable and left the grid announcing "City, Country".
      const heroEntry = city.photos?.find(
        (ph) => (typeof ph === 'string' ? ph : ph.src) === city.heroImage,
      );
      push(city.heroImage, 'landscape', city, typeof heroEntry === 'object' ? heroEntry?.alt : undefined);
    }
    city.photos.forEach(photo => {
      const src         = typeof photo === 'string' ? photo : photo.src;
      const orientation = typeof photo === 'string' ? 'landscape' : (photo.orientation ?? 'landscape');
      const alt         = typeof photo === 'string' ? undefined : photo.alt;
      push(src, orientation, city, alt);
    });
  });
  return list;
}

const ALL_PHOTOS = buildPhotoList();

// ── Component ─────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  // The URL is the source of truth for filter AND lightbox state, not
  // separate useState — that's the whole fix. Before this, a refresh, a
  // shared link, or the back button all silently dropped a visitor back
  // to "All" with no way to see or return to what they were actually
  // looking at; opening the lightbox didn't touch the URL at all, so
  // back (or an OS back-gesture on mobile) exited the whole page instead
  // of just closing the photo.
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const cityParam = searchParams.get('city');
  // Derive the country from the city's own data rather than trusting a
  // second, possibly-missing or mismatched `country` param — a link with
  // only ?city= (hand-edited, or an older link format) still resolves
  // correctly instead of leaving the filter pills' active-state out of
  // sync with what's actually showing in the grid.
  const cityMeta   = cityParam ? cities.find(c => c.name === cityParam) : null;
  const selCity    = cityParam || null;
  const selCountry = cityMeta ? cityMeta.country : (searchParams.get('country') || null);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  // Plain pushes (not `replace`) on purpose: each filter change is a real
  // step in browser history, so back steps out one selection at a time
  // instead of leaving the page entirely — the exact behavior missing
  // before.

  const clearAll      = () => setSearchParams({});
  const selectCountry = (c) => setSearchParams({ country: c });
  const selectCity    = (name) => {
    const meta = cities.find(c => c.name === name);
    setSearchParams(meta ? { country: meta.country, city: name } : { city: name });
  };

  // ── Derived state ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (selCity)    return ALL_PHOTOS.filter(p => p.city === selCity);
    if (selCountry) return ALL_PHOTOS.filter(p => p.country === selCountry);
    return ALL_PHOTOS;
  }, [selCity, selCountry]);

  // Lightbox index lives in ?photo= for the same reason the filter does —
  // shareable, refresh-safe, and (the part that was still missing) a real
  // step in browser history, so back closes the photo instead of leaving
  // the page. Bounds-checked against the CURRENT filtered set: a stale or
  // hand-edited index just fails closed rather than crashing or showing
  // the wrong photo, and a filter that changes out from under an open
  // lightbox (only reachable via back/forward, since clicks can't reach
  // the pills while the lightbox covers them) closes it the same way,
  // for the same reason.
  const photoParam = searchParams.get('photo');
  const photoIndex = photoParam !== null ? Number(photoParam) : NaN;
  const lightboxIndex = Number.isInteger(photoIndex) && photoIndex >= 0 && photoIndex < filtered.length
    ? photoIndex
    : null;

  // Whichever grid button opened the lightbox, so closing it (however that
  // happens — Escape, the close button, the backdrop) returns keyboard focus
  // to where it left off instead of dropping it back to the document body.
  const lightboxTrigger = useRef(null);
  // Tracks whether *this component* pushed the current ?photo= history
  // entry (a grid click) versus it already being in the URL on arrival (a
  // direct/shared link). Only the first case has an internal entry worth
  // popping — closing via browser back() on the second would leave the
  // site entirely, taking the visitor to whatever page linked here.
  const openedInternally = useRef(false);

  const openLightbox = (e, i) => {
    lightboxTrigger.current = e.currentTarget;
    openedInternally.current = true;
    const next = new URLSearchParams(searchParams);
    next.set('photo', String(i));
    setSearchParams(next);
  };
  const closeLightbox = () => {
    if (openedInternally.current) {
      navigate(-1);
    } else {
      const next = new URLSearchParams(searchParams);
      next.delete('photo');
      setSearchParams(next, { replace: true });
    }
    openedInternally.current = false;
    lightboxTrigger.current?.focus();
  };
  // Prev/Next replace rather than push: browsing ten photos in one
  // lightbox session should still be one back-press to leave, not ten.
  const goToPhoto = (i) => {
    const next = new URLSearchParams(searchParams);
    next.set('photo', String(i));
    setSearchParams(next, { replace: true });
  };

  // Sorted by photo count, most substantial first — not just for the
  // visual rhythm break below (see .gallery-filter__row--sub in App.css):
  // a country's biggest collections lead the row instead of whatever
  // order they happen to sit in in cities.js, which matters most exactly
  // when there are enough cities that a visitor won't necessarily scan
  // every pill. Safe to sort in place: .filter() already returns a fresh
  // array, not the shared `cities` reference.
  const activeCities = useMemo(
    () => selCountry
      ? cities.filter(c => c.country === selCountry)
          .sort((a, b) => b.photos.length - a.photos.length)
      : [],
    [selCountry],
  );

  // Tally text — lives in the page header now, not the filter row (see JSX
  // below), so it reads standalone rather than beside the pill it refers to.
  // Always "how many photos am I looking at right now" — the previous
  // "13 / 46" city-vs-country comparison needed that adjacency to make
  // sense and wouldn't have up in the header.
  const tallyText = useMemo(
    () => `${filtered.length} photo${filtered.length === 1 ? '' : 's'}`,
    [filtered],
  );

  // Was a hardcoded "All photos across Asia" that never changed — a
  // visitor filtered down to Macau's one photo still read that line
  // above a tally that plainly contradicted it.
  const subtitleText = useMemo(() => {
    // selCountry can be null here even with selCity set — an unrecognized
    // ?city= (garbage input, a typo'd or stale link) fails the cities.js
    // lookup that would normally derive it. Found by testing exactly that
    // input, not assumed: without this branch the template literal below
    // stringifies null as the literal word "null" in the visible copy.
    if (selCity)    return selCountry ? `Photos from ${selCity}, ${selCountry}` : `Photos from ${selCity}`;
    if (selCountry) return `Photos from ${selCountry}`;
    return 'All photos across Asia';
  }, [selCity, selCountry]);

  const activeLabel = selCity ?? selCountry ?? 'All';
  const isEmpty = filtered.length === 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="gallery-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="gallery-page__header">
        <h1 className="gallery-page__title">Gallery</h1>
        {/* Tally lives here now, not in the filter row below — see the
            comment on tallyText. Keeping it out of the pills entirely means
            it never has to compete with them for space, at any width. */}
        <div className="gallery-page__subrow">
          <AnimatePresence mode="wait">
            <motion.p
              key={subtitleText}
              className="gallery-page__sub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {subtitleText}
            </motion.p>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.span
              key={tallyText}
              className="gallery-page__tally"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {tallyText}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Filter nav ──
          Pills wrap instead of scrolling — every option is visible without
          a sideways swipe, which is the whole point of a filter list; one
          you can't see all of isn't really a filter, it's a maze. */}
      <div className="gallery-filter">

        {/* Row 1 — All + Countries */}
        <div className="gallery-filter__row gallery-filter__row--main">
          <FilterPill
            label="All"
            active={!selCountry && !selCity}
            onClick={clearAll}
            levelId="country"
          />
          <span className="gallery-filter__divider" />
          {countries.map(country => (
            <FilterPill
              key={country}
              label={country}
              active={selCountry === country}
              onClick={() => selectCountry(country)}
              levelId="country"
            />
          ))}
        </div>

        {/* Row 2 — Cities (shown when a country is selected) */}
        <AnimatePresence>
          {activeCities.length > 0 && (
            <motion.div
              key="city-row"
              className="gallery-filter__row gallery-filter__row--sub"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {activeCities.map(city => (
                <FilterPill
                  key={city.slug}
                  label={city.name}
                  active={selCity === city.name}
                  onClick={() => selectCity(city.name)}
                  levelId="city"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Photo grid */}
      {isEmpty ? (
        <div className="gallery-empty">
          <p>No photos yet for <strong>{activeLabel}</strong>. Check back soon.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          <AnimatePresence>
            {filtered.flatMap((photo, i) => {
              const nodes = [];
              const prev = filtered[i - 1];

              // Scroll dividers: the one thing this grid was missing. Scrolling
              // the unfiltered wall used to lose "the journey is the organizing
              // idea" the moment a visitor stopped hovering — nothing marked
              // where one city ended and the next began. Real content
              // boundaries only: never shown once a single city is selected,
              // since the active filter pill already says where you are.
              // Country tier only fires in the true "All" view — it's the
              // only context that ever spans more than one country.
              const isNewCity    = !selCity && (i === 0 || photo.city !== prev.city);
              const isNewCountry = isNewCity && !selCountry && (i === 0 || photo.country !== prev.country);
              if (isNewCity) {
                // Heading level follows what's actually above it in the
                // document, not a fixed template: nested under a country h2
                // in the unfiltered view, it's an h3; with a country already
                // selected there's no h2 in this grid at all, so the city
                // label is the top of the outline here and needs to be an h2
                // itself — an h3 with no h2 before it is a skipped level.
                const CityTag = selCountry ? 'h2' : 'h3';
                nodes.push(
                  <motion.div
                    key={`divider-${photo.city}`}
                    className={`gallery-divider${isNewCountry ? ' gallery-divider--country' : ''}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Real headings, not styled spans: a screen-reader user
                        can jump this 129-photo wall by heading the same way
                        a sighted visitor scans it by eye — otherwise the
                        "no place context" gap this divider exists to fix
                        would still stand for anyone navigating that way. */}
                    {isNewCountry && (
                      <h2 className="gallery-divider__country">{photo.country}</h2>
                    )}
                    <CityTag className="gallery-divider__city">
                      {photo.city}{photo.year ? ` · ${photo.year}` : ''}
                    </CityTag>
                  </motion.div>,
                );
              }

              nodes.push(
                <motion.button
                  key={photo.src}
                  type="button"
                  // gallery-item--<orientation> only matters above the 900px
                  // breakpoint (see .gallery-grid in App.css): that's the
                  // mosaic-with-captions design. Below it, a dense uncaptioned
                  // square wall — the modifier class is simply unused there.
                  className={`gallery-item gallery-item--${photo.orientation ?? 'landscape'}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  // A per-item stagger up to 0.25s reads nicely on one
                  // filter click (a single cascading reveal) but was also
                  // governing EXIT — up to 129 outgoing tiles fading out
                  // with the same staggered delay meant a leaving filter's
                  // last items could take up to ~0.5s to actually clear
                  // the DOM. Switching filters again inside that window
                  // (verified: clicking through country tabs at normal
                  // speed) let multiple filters' worth of stale nodes pile
                  // up before any of them finished settling. Exit now
                  // carries its own fast, unstaggered transition — every
                  // outgoing tile clears together in under 150ms
                  // regardless of how many there are — while entering
                  // tiles keep the cascade.
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
                  onClick={(e) => openLightbox(e, i)}
                  aria-label={photo.alt || `${photo.city}, ${photo.country}`}
                >
                  {/* alt="": the aria-label above already names the photo for
                      assistive tech either way. The overlay caption below is
                      only shown above 900px (on hover) — it's rendered
                      unconditionally and hidden in CSS on narrower screens,
                      not removed from the DOM, so nothing here needs to know
                      which design is currently active. */}
                  <img
                    src={thumbSrc(photo.src)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="gallery-item__overlay">
                    <span className="gallery-item__city">{photo.city}</span>
                    <span className="gallery-item__country">{photo.country}</span>
                  </div>
                </motion.button>,
              );

              return nodes;
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={filtered}
            index={lightboxIndex}
            onClose={closeLightbox}
            onPrev={() => goToPhoto((lightboxIndex - 1 + filtered.length) % filtered.length)}
            onNext={() => goToPhoto((lightboxIndex + 1) % filtered.length)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── FilterPill ────────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick, levelId = 'country' }) {
  return (
    <button
      className={`gallery-filter__pill${active ? ' gallery-filter__pill--active' : ''}`}
      onClick={onClick}
      // aria-current, not aria-pressed: these pills are a mutually-exclusive
      // set (picking one deactivates whichever else was active), which is
      // what aria-current — "the current item within a set" — describes.
      // aria-pressed declares a two-state toggle on that one button alone,
      // which isn't what's happening here. Sighted visitors already get
      // this from the border/underline/bar; screen-reader users got
      // nothing before this.
      aria-current={active ? 'true' : undefined}
    >
      {label}
      {active && (
        <motion.span
          className="gallery-filter__pill-bar"
          layoutId={`filter-bar-${levelId}`}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
