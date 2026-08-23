# Working in this repo

Product truth lives in [PRODUCT.md](PRODUCT.md). This file is how we work.

## Visual changes are staged, never edited in place

**Do not redesign a live component by editing it.** When changing how something looks or
behaves visually, build the new version alongside the existing one, let the owner compare
them running, and only replace the original once they approve it.

```
src/components/sandbox/          new versions live here while under review
/sandbox/<name>                  unlisted route to view one (never linked from nav)
```

The old component keeps working untouched the whole time. Approval means moving the new
version into place and deleting the sandbox copy; rejection means deleting the sandbox
copy and nothing else changed.

This exists because in-place iteration on this site has repeatedly meant several rounds of
"try a number, look, revert" with the live page broken in between. Staging makes rejection
free.

Small fixes — a spacing tweak, a colour, a copy change, a bug — do not need this. It is for
redesigns and new visual concepts.

## Commands

```bash
npm run dev              # dev server
npm run build            # production build
npm run import-photos    # ingest photos from .exif-inbox/<city>/  (add --dry to preview)
npm run generate-thumbs  # backfill missing 800px WebP thumbnails
npm run generate-og      # rebuild the 1200x630 social preview image
```

## Adding photographs

1. Drop **full-resolution originals** into `.exif-inbox/<city-slug>/`
2. `npm run import-photos`

It handles EXIF, archiving, both served tiers, `cities.js`, `photo-meta.js`, and hero
promotion. Files under 1 MB are rejected as probable web exports.

A new city needs an entry in `src/data/cities.js` first — name, country, lat/lon, year,
`heroImage: null`, `photos: []`.

## Things that have bitten us

- **`cities.js` is the single source of truth.** Never hand-maintain a second list of
  cities or slugs elsewhere; derive from it. A hardcoded country map silently dropped
  Kamakura from Japan's map zoom, and would have dropped Hangzhou too.
- **`public/photos/` holds print-resolution originals and is gitignored.** A local
  `npm run build` copies them into `dist/` (~1.3 GB). Deploy from GitHub, not by uploading
  a local `dist/`, or the entire sellable archive ships for free.
- **Routing needs host rewrites.** `BrowserRouter` means every path must serve
  `index.html`. `netlify.toml`, `vercel.json` and `public/_redirects` handle this. Test
  deep links against a **built** server — the dev server hides the problem with its own
  fallback.
- **`.env` holds `VITE_WEB3FORMS_KEY`.** It is gitignored, so it must also be set in the
  host's environment variables or the contact form silently fails in production.

## Verifying UI in the preview pane

- Check `document.visibilityState` **before trusting any animation measurement**. A hidden
  pane throttles `requestAnimationFrame`, which freezes GSAP and makes working code look
  broken. This has caused a false bug report.
- Screenshot at **~1100px**. Forcing 1440px renders scaled down too small to judge.
- **A pane that is not focused dispatches no focus events.** `document.hasFocus()` false
  means `element.focus()` still sets `activeElement` but fires no `focus` or `focusin`, so
  any handler hanging off them looks dead when it is fine. Test those handlers by
  dispatching the event directly (`el.dispatchEvent(new FocusEvent('focusin', {bubbles:true}))`)
  and say plainly that real keyboard focus was not exercised.
- **The same throttling freezes CSS transitions, not just GSAP.** A transitioned property
  reports its start value forever, and `!important` will not move it. Add
  `transition: none !important` before measuring or screenshotting a transitioned state.
- Measuring geometry proves position and spacing. It does not prove something looks right —
  look at it.
