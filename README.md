# Jayden Ng — Photography Portfolio

A personal record of [Jayden Ng](https://github.com/frupsie)'s journey in photography —
where he has been and what he made there — that doubles as a portfolio site.

## What this is

This is a **logbook first, a sales surface second**. In the owner's own words, it exists
"to display and keep track of what I have done in my journey in the field of
photography." Rather than organizing work by genre or client the way a conventional
portfolio would, everything here is organized around **the journey**: photographs are
grouped by city and country, ordered by when he arrived, and shown with their real
capture metadata (camera, lens, shutter, aperture, ISO, focal length) — the EXIF is part
of the work's credibility, not decoration.

It currently holds around 220 photographs across 13 cities in China, Japan, and South
Korea, all shot on real gear (Canon EOS RP, Fujifilm X-T30 II, iPhone 16 Pro Max) and
imported with their genuine EXIF data. There are no fabricated clients, testimonials, or
sales history — photography isn't yet a source of income for the owner, and the site is
built to look like exactly what it is: a serious, honest personal archive, not a business
that doesn't exist yet.

Two audiences are served without a mode switch: people who just want to look at the
photographs, and prospective clients skimming quickly to judge range and consistency.

## The site

- **Home** — a full-bleed opening, a sticky typographic index of every city, a pinned
  horizontal pan through a curated set of favourites, and a closer.
- **Gallery** — every photograph, filterable by country/city and sortable by location or
  true capture date.
- **City pages** — one per destination, with the full set of photos taken there.
- **About** — the photographer, the gear, the approach.
- **Contact** — a form (delivered via Web3Forms) for anyone who wants to get in touch.

## Tech stack

- **React 19 + Vite**, routed with React Router's `BrowserRouter`
- **GSAP ScrollTrigger + Lenis** for the scroll-driven sections, bridged through a shared
  RAF ticker
- **Framer Motion** for gesture-driven interactions (the lightbox's swipe-to-navigate)
- **sharp** + **exifr** power the photo-import pipeline (EXIF extraction, resizing,
  re-encoding)
- Plain CSS, no component framework — the dark, restrained, gold-accented palette is
  hand-built and deliberately doesn't compete with the photographs

## Adding photographs

The owner is the only editor, and there's no CMS — photos arrive in batches after a trip
and get imported in one pass:

1. Drop full-resolution originals into `.exif-inbox/<city-slug>/`
2. `npm run import-photos`

This reads each photo's real EXIF, archives the original, generates both served image
tiers, updates `src/data/cities.js` and `src/data/photo-meta.js`, and promotes a hero
image for any city that doesn't have one yet. A brand-new city needs a manual entry in
`src/data/cities.js` first (name, country, lat/lon, year) before its first import.

Photographs are served in three tiers:

| Tier | Location | Purpose |
|---|---|---|
| Full-resolution originals | `public/photos/` (gitignored, local only) | Archive — never deployed |
| 1600px JPEG | `public/photos-web/` | Lightbox, hero images |
| 800px WebP | `public/photos-thumb/` | Grids |

## Commands

```bash
npm run dev                    # start the dev server
npm run build                  # production build
npm run import-photos          # ingest new photos from .exif-inbox/<city-slug>/ (add --dry to preview)
npm run generate-thumbs        # backfill any missing 800px WebP thumbnails
npm run generate-og            # rebuild the 1200x630 social preview image
npm run backfill-photo-dates   # backfill real EXIF capture dates onto existing photos
```

## Deployment

Hosted on **Netlify**, deployed from this GitHub repo (not from a local build — the
gitignored full-resolution originals would otherwise ship for free). `netlify.toml`
rewrites every path to `index.html` so client-side routing survives a page refresh or a
shared deep link; `.env` must carry `VITE_WEB3FORMS_KEY` in the host's environment or the
contact form silently fails in production.

## Project docs

- [`PRODUCT.md`](PRODUCT.md) — product purpose, audiences, and binding brand commitments;
  the source of truth for *why* the site is built the way it is
- [`CLAUDE.md`](CLAUDE.md) — working conventions for this repo (visual-change workflow,
  commands, known gotchas)
