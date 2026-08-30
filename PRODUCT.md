# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two real audiences, neither dominant:

- **People who came to look.** Friends, followers, fellow photographers, anyone sent a
  link. They arrive with no task and no deadline. They are here for the photographs.
- **Prospective clients evaluating whether to hire.** Art directors, editors, brands.
  They arrive with intent, skim quickly, and want to judge range and consistency fast.

The tension between a slow immersive experience and a fast scan is genuine and
deliberately unresolved. Future work navigates it rather than declaring a winner.

## Product Purpose

A personal record of Jayden Ng's journey in photography — where he has been and what he
made there — that doubles as a portfolio.

In the owner's words, the site exists "to display and keep track of what I have done in
my journey in the field of photography." It is a **logbook first and a sales surface
second**. Success is that the body of work reads as coherent and worth looking at, and
that it keeps accumulating faithfully as he travels.

## Positioning

Organised around **the journey**, not around categories, clients, or services. Work is
grouped by city and country, ordered by when he arrived, and shown with the real capture
metadata. A conventional portfolio sorts by genre or client; this one is a travel record
that happens to be a portfolio.

## Operating Context

- Photographs arrive **in batches after a trip**, not continuously. The site is edited in
  bursts.
- Import pipeline: drop full-resolution originals into `.exif-inbox/<city-slug>/`, run
  `npm run import-photos`. That reads real EXIF, archives the original, generates both
  served tiers, updates `cities.js` and `photo-meta.js`, and promotes a hero.
- Adding a new city is a manual entry in `src/data/cities.js` (name, country, lat/lon,
  year) followed by an import.
- The owner is the only editor. There is no CMS and no second contributor.

## Capabilities and Constraints

- React 19 + Vite SPA using React Router `BrowserRouter`. Client-side routing means the
  host **must** rewrite all paths to `index.html`; configs exist for Netlify and Vercel.
- Scroll experience built on GSAP ScrollTrigger with Lenis smooth scroll. The two are
  bridged through a single shared RAF ticker — animation work must respect that.
- Three image tiers: full-resolution originals (**local only, gitignored, never
  deployed**), 1600px JPEG served to lightbox and heroes, 800px WebP served to all grids.
- Currently 13 cities / 129 photographs across China, Japan, and South Korea.
- Contact delivers through Web3Forms to `ngziyu.co@gmail.com`; a static site cannot send
  mail itself.
- Intended host: Netlify. Vercel's free Hobby tier prohibits commercial use, which would
  become a constraint if the site ever sells anything.

## Brand Commitments

**Binding — preserve these:**

- **The dark, restrained palette.** Near-black grounds with muted gold accents, minimal
  chrome. The photographs carry the colour; the interface does not compete.
- **EXIF surfaced on the photographs.** Camera, lens, shutter, aperture, ISO, focal
  length. This is part of the work and its credibility, not decoration.
- The name **Jayden Ng**, and Singapore as home base.

**Explicitly not binding:** the homepage concept. The current homepage — full-bleed
opening, sticky typographic city index, pinned horizontal pan of the favourites, closer —
replaced an earlier four-act cinematic scroll. The owner has left it open to further
reconsideration, including its concept.

## Evidence on Hand

**Real:**

- 129 photographs across 13 cities, all with genuine EXIF from the actual shoots.
- A real, accurate gear list (Canon EOS RP, Fujifilm X-T30 II, iPhone 16 Pro Max, plus
  lenses, filters, and software).
- Genuine travel history 2023–2026 with real coordinates.

**Absent — future work must not fabricate these:**

- No client work, commissions, testimonials, published credits, press, or awards.
- No sales history, pricing, or licensing terms.
- Photography is **not currently a source of income**.
- The contact page presently advertises "travel commissions, editorial licensing, and
  print orders." This is **aspirational, not an existing practice** — flagged as copy to
  revisit so the site does not claim a business that does not yet exist.

## Product Principles

1. **The photographs lead.** Every interface decision defers to the image. Chrome that
   competes with a photograph is wrong by default.
2. **Truthful over impressive.** No invented clients, credentials, or proof. The site
   should look like what it is — a serious personal body of work by someone not yet
   working commercially.
3. **The journey is the organising idea.** Place and chronology are the spine. Genre and
   client are not.
4. **It must stay cheap to add to.** New cities and photographs arrive in bursts; anything
   that requires hand-maintaining a second list will rot. Derive from `cities.js`.
5. **One surface, two speeds.** A visitor who wants to linger and one who wants to skim
   must both get what they came for without a mode switch.

## Accessibility & Inclusion

- `prefers-reduced-motion` is respected throughout the scroll experience; acts collapse to
  static equivalents rather than disappearing.
- **Known gap:** only the 12 city hero images carry real descriptive alt text. The
  remaining gallery photographs still use generic placeholders such as "Tokyo, Japan"
  repeated across many images. On an image-only site this is both an accessibility failure
  and wasted search signal.
- No formal standard (WCAG level) has been established as a requirement.
