---
target: gallery page
total_score: 23
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-29T12-13-26Z
slug: src-components-pages-gallerypage-jsx
---
Method: dual-agent (A: ae6a284eb419ae30d · B: a1dd9a71b8ca40506)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Active pill + tally update correctly; no loading skeleton for lazy images (minor, mitigated by fixed aspect-ratio boxes) |
| 2 | Match System / Real World | 3/4 | Taxonomy and labels read naturally, but the primary scroll view drops the place structure it's organized around |
| 3 | User Control and Freedom | 2/4 | Filter state is plain `useState`, not URL-synced — no bookmarkable/shareable filtered view, refresh silently resets to "All" |
| 4 | Consistency and Standards | 3/4 | Pill styling and shared lightbox are consistent; mobile lightbox has no swipe gesture, breaking standard mobile-gallery convention |
| 5 | Error Prevention | 3/4 | Nothing destructive to prevent; main gap is the same state-loss-on-refresh as #3 |
| 6 | Recognition Rather Than Recall | 2/4 | Mobile grid gives zero city/country context per tile (no hover state exists ≤900px); desktop hover captions exist but are undersized (10.88px, detector-confirmed) |
| 7 | Flexibility and Efficiency | n/a | Experience-mode surface — arrow-key nav + Escape already exceed the relevant baseline |
| 8 | Aesthetic and Minimalist Design | 4/4 | Genuinely restrained; gold used only where it means something, no decorative clutter |
| 9 | Error Recovery | 3/4 | Empty-state copy is warm and on-brand but offers no inline way back to "All" |
| 10 | Help and Documentation | n/a | Not applicable to a browse surface |
| **Total** | | **23/32** | **72% — Good** |

Two heuristics scored n/a under this surface's Experience mode (portfolio/gallery — the visitor is inside the work, not completing a task), per the product's own mode taxonomy.

## Design Specificity Verdict

**LLM assessment**: Mixed. The chrome-level details are genuinely product-specific — the lightbox's EVF-style corner brackets evoke a camera viewfinder, real EXIF is surfaced per photo, and the near-black + muted-gold palette is applied with discipline. These would look wrong on an unrelated e-commerce or blog gallery. But the flagship "All" grid — the view every first-time visitor lands on — is a bog-standard, undifferentiated photo wall: 129 buttons, zero section headers or dividers. The one idea PRODUCT.md calls central, "the journey is the organizing idea," is expressed only in the filter row above the grid, not in the primary browsing experience itself. Distinctive in the details, generic in the one structural decision that mattered most.

**Deterministic scan**: `detect.mjs --json` against `GalleryPage.jsx` + `PhotoLightbox.jsx` directly returned exit 0, `[]` — clean. The live-page injection (`detect.js` against the rendered DOM) found 132 raw hits, but that count is inflated by per-node repetition of the same ~3 underlying CSS rules across 129 photo tiles, not 132 distinct defects:
- **Real, gallery-owned**: `.gallery-item__country` renders at `0.68rem` = **10.88px**, under the detector's 11px functional-text floor — the desktop hover caption text is legitimately too small. Traced to `App.css`, confirmed against the exact console value.
- **Real, gallery-owned but borderline**: `.gallery-page__sub` ("All photos across Asia") carries `letter-spacing: 0.06em`, flagged as wide-tracking on body text — a mild value on a 4-word subheading, not a paragraph; worth treating as minor rather than a clear defect.
- **False positives for this target**: a `transition: width` hit traces to `.navbar__hamburger span` and a second `wide-tracking: 0.10em` hit traces to global footer/nav chrome (`App.css`) — both are shared site-wide components rendered on every route, not code owned by `GalleryPage.jsx` or `PhotoLightbox.jsx`. Neither should count against this page.
- `PhotoLightbox.jsx` was never opened during the live scan, so its "clean" status rests on the static CLI pass only, not live-DOM evidence.

**Visual overlays**: Injection succeeded and the detector ran in the page — a toast and per-element outline boxes did appear, drawn directly over the undersized country captions and (misattributed) over the navbar hamburger. The live server backing that overlay has since been stopped, as required for cleanup, so the tab it ran in no longer shows a *live* overlay if reopened — this is a record of what was found, not a currently-interactive view.

## Overall Impression

The page is well-crafted at the level of individual moments — the lightbox is the best-built thing on the site — but flat at the level of the whole. A visitor scrolling the default "All" view gets a beautiful, undifferentiated wall with no sense of place or time, which is exactly backwards for a product whose entire positioning is "organized around the journey, not categories." The biggest opportunity is carrying that organizing idea into the scroll itself, not just the filter row sitting above it.

## What's Working

- **Real, descriptive alt text on every photo** (e.g. *"A red hurricane lantern glowing under a palm-thatch roof strung with rope"*), plus per-tile `aria-label` — this resolves the "known gap" flagged in PRODUCT.md; worth recording as fixed, not still-open.
- **Lightbox focus management is genuinely well-built**: closing via Escape, the close button, or the backdrop all correctly return keyboard focus to the exact grid tile that opened it, and the Tab-trap correctly scopes to the modal. Most portfolio sites skip this entirely.
- **EXIF-as-credibility is executed with restraint** — camera/lens/exposure plus location/date in a quiet monospace card that never competes with the photograph, directly honoring the "photographs lead" brand commitment.

## Priority Issues

**[P1] No place or chronology context while scrolling the primary "All" view**
*Why it matters*: PRODUCT.md states "the journey is the organizing idea," but the flagship view is a flat 129-item wall with zero section headers. The only way to know what city a tile belongs to is hovering one at a time (desktop-only) or opening the lightbox — and the visitor least likely to pre-filter ("people who came to look") is exactly the one who never sees this structure.
*Fix*: Sticky or inline city/country labels as the grid scrolls, or a persistent "currently viewing" indicator tied to scroll position.
*Suggested command*: `/impeccable layout`

**[P1] Filter selection isn't persisted anywhere durable**
*Why it matters*: `selCountry`/`selCity` are plain component state, never written to the URL. A refresh, a shared link, or browser back/forward all silently drop the filter back to "All." A prospective client who wants to send someone a link to just the Japan work has no way to do that.
*Fix*: Sync filter selection to the URL (query params or route segments) — shareable, refresh-safe, back-button-navigable.
*Suggested command*: `/impeccable harden`

**[P2] Mobile lightbox has no swipe navigation, and its buttons are barely visible**
*Why it matters*: The prev/next controls are 40px circles with a 16%-opacity white border — hard to see against a busy photo. On a surface built around thumb-driven photo browsing, requiring a precise tap instead of the swipe every native photo viewer trains people to expect is real friction.
*Fix*: Add horizontal swipe/drag on the image; raise the buttons' visual weight (a solid low-opacity backing chip, not just a thin outline).
*Suggested command*: `/impeccable polish`

**[P2] Country-label captions render under the 11px legibility floor**
*Why it matters*: `.gallery-item__country` is 10.88px — detector-confirmed, reproducible on every hover caption across all 129 tiles. This is the only per-photo context a desktop visitor gets without opening the lightbox, and it's sized below comfortable reading threshold.
*Fix*: Bump `.gallery-item__country` to at least 11px; check `.gallery-item__city` alongside it for the same issue.
*Suggested command*: `/impeccable typeset`

**[P2] City sub-row can exceed comfortable chunk size**
*Why it matters*: China's sub-row already shows 6 cities in one row, over the ≤4-per-group guideline, and the archive is explicitly built to keep growing (Hangzhou is already a placeholder entry with 0 photos).
*Fix*: Accept as a deliberate browse-density choice, or introduce a lightweight secondary grouping once a country passes ~5 cities.
*Suggested command*: `/impeccable layout`

## Persona Red Flags

**Casey (Distracted Mobile User)**
- No swipe gesture anywhere in `PhotoLightbox.jsx` (only `keydown` and click handlers) — forces precise taps on small, low-contrast buttons instead of the swipe every mobile photo viewer trains users to expect.
- The mobile grid gives zero visual way to tell what she's looking at without tapping in — poor fit for one-handed, half-attention browsing where she wants to recognize "oh, Tokyo" at a glance.

**Sam (Accessibility-Dependent)**
- Alt text and focus management are genuine strengths (credited above).
- The result tally has no `aria-live` region — a screen-reader user who applies a filter gets no announcement that the count changed from "129 photos" to "46 photos," a purely visual update.
- The empty state ("No photos yet for Hangzhou") reached via keyboard filtering isn't announced either.

**Riley (Deliberate Stress Tester)**
- Refresh mid-filter silently resets to "All" — confirmed live, ties directly to the P1 above.
- 0-photo (Hangzhou) and 1-photo (Macau) filter results both render without crashing, but the 1-photo case leaves a visually orphaned tile in a mostly-empty row.
- Rapid successive filter changes (country → city → different city) handled correctly with no state corruption — only the ordinary animation catching up, cosmetic not functional.

## Minor Observations

- Tally text correctly handles singular/plural ("1 photo" vs. "46 photos") — small, real polish.
- The Hangzhou pill appearing despite 0 photos is a deliberate, good "more coming" signal consistent with a logbook meant to stay cheap to add to — worth preserving in any future pass.
- `.gallery-item__country`'s hover gradient (`rgba(0,0,0,0.6)` to transparent) is probably fine but worth a spot-check over the brightest, sky-heavy frames (Hakone/Nikko snow) rather than assuming.
- Single-photo filter result (e.g. Macau) ends a filtered session on a visually orphaned tile with a large empty void beside it — consider centering sparse results.
- `.gallery-page__sub`'s `0.06em` letter-spacing is a borderline detector hit, not a clear defect — low priority if addressed at all.

## Questions to Consider

1. If "the journey" is the organizing idea, why does the primary "All" view — the one every first-time visitor lands on — actively hide it? What would it look like to make place and time visible *during* the scroll, not just in the filter row above it?
2. The lightbox is clearly the most crafted moment on this page. Should the grid borrow some of that same specificity, or is a plain wall the right contrast to set up that payoff?
3. Is "All photos across Asia" as one continuous 129-item scroll the right default, or would this product be better served landing on the *countries* level, treating "All" as an explicit opt-in for people who really do want everything at once?
4. Prospective clients "arrive with intent, skim fast, judge range/consistency quickly" — what does this page currently let them skim *for*? Right now the only skimmable signal is visual variety; there's no way to quickly answer "has he shot in China more than Japan" or "what's most recent" without manually working through pills.
