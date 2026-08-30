---
target: gallery page
total_score: 29
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-29T17-41-37Z
slug: src-components-pages-gallerypage-jsx
---
Method: dual-agent (A: a33058024bfbbeed2 · B: a261762bf741f9a3e)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | URL/tally/aria-current all live-correct; `document.title` never changes across routes or filters |
| 2 | Match System / Real World | 4/4 | Country/city vocabulary, real photographic terms, journey framing match both audiences |
| 3 | User Control and Freedom | 4/4 | Verified live: back-button closes only the lightbox on internal opens, refresh mid-photo restores exact state, single-photo Prev/Next correctly hidden — every one of the last two hardening passes holding up under a fresh audit |
| 4 | Consistency and Standards | 3/4 | Filter pills fall back to the browser's raw default focus outline instead of the site's own branded ring used everywhere else |
| 5 | Error Prevention | 4/4 | Bounds-checked `?photo=` fails closed on garbage input; unrecognized `?city=` falls back gracefully; dead Prev/Next hidden rather than left clickable |
| 6 | Recognition Rather Than Recall | 4/4 | Active filter state always visible, dividers re-orient scroll position with place+year, nothing requires remembering a prior screen |
| 7 | Flexibility and Efficiency | n/a | No power-user task this Experience-mode surface withholds |
| 8 | Aesthetic and Minimalist Design | 4/4 | Photograph-led, restrained chrome, EVF motif purposeful not decorative |
| 9 | Error Recovery | 3/4 | Empty filter handled well; no fallback UI for a failed image load |
| 10 | Help and Documentation | n/a | Not applicable to a browse surface |
| **Total** | | **29/32** | **91% — Excellent** |

## Design Specificity Verdict

**LLM assessment**: Not a reskinned generic gallery. Country→city filtering (not tag/genre), scroll dividers stamped with real capture years, and the lightbox's EVF chrome with genuine EXIF front-and-center are choices that only make sense for a photographer's own archive — none of it is swappable into an e-commerce or blog gallery without rewriting the data model and the lightbox from scratch.

**Deterministic scan**: static scan clean; live-DOM found 3 hits. Of those: one is the same borderline `.gallery-page__sub` tracking value flagged in all four critique runs now (still real, still never prioritized above something more impactful); one traces to `Footer.jsx`, shared chrome outside this review's scope; one — a `transition: padding-left` hit on `document.body` — Assessment B traced to the CSS spec's own *default initial value* (`transition-property: all`, `duration: 0s`) rather than any authored rule anywhere in the codebase, and confirmed no functioning transition exists. A likely detector false positive, not a real finding.

## Overall Impression

The structural and functional work from this session's whole chain — journey-structure dividers, mobile lightbox composition, swipe, URL/history state, single-photo handling — is now independently confirmed solid under a completely fresh audit. What's left is finer-grained: a still-undersized mobile photo (the geometry problem is understood, but the *next* level of ambition would restructure around it rather than just accept it), a missing branded focus ring, and a couple of SPA-hygiene gaps.

## What's Working

- **URL-as-state-machine, re-verified end-to-end**: back-button while the lightbox is open closes only the photo; a direct load of `/gallery?photo=5` opens the correct photo; refresh mid-photo restores exact state; Macau's single photo correctly hides Prev/Next. All of last session's hardening holding up under independent re-test.
- **Real alt text + correct heading outline**: `H1 Gallery > H2 China > H3 Hainan · 2025 > ...` confirmed via DOM query — a screen-reader user heading-jumps the wall the same way a sighted visitor scans it.
- **EVF-styled lightbox with real EXIF surfaced by default** — not hidden behind a toggle, reinforcing "logbook first."

## Priority Issues

**[P1] Mobile lightbox still under-uses the viewport for landscape photos**
Why it matters: confirmed via `getBoundingClientRect`: the image is 337×240px, leaving real empty space above and below the composed photo+EXIF block. The earlier fix closed the *dead space between* the photo and its caption, but the photo itself is still width-bound by geometry — "the photographs lead" is brand commitment #1, and this is the single biggest emotional beat on the page, visibly small on the device most casual visitors use.
Fix: let the photo claim more of the remaining vertical budget after the EXIF card, or make the EXIF card collapse below the fold by default on mobile, rather than a flat height cap tuned for the worst case.
Suggested command: `/impeccable layout`

**[P2] Filter pills have no branded focus-visible style**
Why it matters: `.gallery-filter__pill` falls back to the browser's raw default outline instead of the `outline: 2px solid var(--accent)` pattern used on every other control on this page — an off-brand ring on the page's primary control.
Fix: add `.gallery-filter__pill:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`.
Suggested command: `/impeccable polish`

**[P2] EXIF label text is under this page's own 11px floor**
Why it matters: `.exif-card__label` (CAM/LNS/EXP) computes to 8.8px — the smallest text on the page, inside the element PRODUCT.md calls "part of the work's credibility, not decoration," and under the exact 11px floor already enforced on `.gallery-item__country` earlier in this same file.
Fix: bump to ≥0.7rem (11.2px), matching the floor already set elsewhere.
Suggested command: `/impeccable typeset`

**[P3] Rapid filter switching causes a visible animation pile-up**
Why it matters: clicking through country tabs in quick succession left 129 grid items in the DOM for ~1–1.5s past when 46 should have settled — state always lands correctly, but it's visibly janky, and the first thing a fast-skimming visitor (or a stress-tester) would hit.
Fix: coordinate/cancel in-flight exit animations on a new filter change.
Suggested command: `/impeccable animate`

**[P3] No per-route or per-filter `document.title`**
Why it matters: confirmed identical title across `/`, `/gallery`, and any filtered state — no title-based confirmation for screen-reader or multi-tab users that the page or filter changed.
Suggested command: `/impeccable harden`

## Persona Red Flags

**Sam (Accessibility-Dependent)** — off-brand focus ring on filter pills (P2); 8.8px EXIF labels (P2); no `document.title` change or `aria-live` on filter change. Genuine strength: heading structure and real alt text let Sam navigate the wall by heading-jump.

**Casey (Distracted Mobile User)** — mobile lightbox Prev/Next and filter pills both measure 40px, a few px under 44px comfort size though consistent sitewide; landscape photos fill only ~30% of the lightbox viewport height. Genuine mitigating strength: swipe-to-navigate has proper elastic drag with dual offset/velocity thresholds, reducing reliance on the small buttons for one-handed use.

**Riley (Deliberate Stress Tester)** — garbage `?photo=99999` and unrecognized `?city=` both fail closed cleanly; rapid filter clicking is the one place a real (cosmetic, not data) defect surfaced (P3 above); refresh-mid-photo, single-photo suppression, and browser-back all confirmed correct with no dead ends found.

## Minor Observations

- Unrecognized `?city=` renders the same empty-state copy as a real, intentionally-empty city — a visitor with a typo'd link gets no signal the URL itself is the problem.
- No `onError` fallback exists anywhere in the codebase for a failed image load.
- `.gallery-page__sub`'s letter-spacing remains the one recurring borderline detector finding across all four critique runs now — genuinely intentional per its own CSS comments (paired deliberately with `.gallery-page__tally`), not obviously a bug, just never prioritized.

## Questions to Consider

1. If "the journey is the organizing idea," should the unfiltered wall let a visitor jump straight to a known city, or is the forced country→city descent itself part of the intended pacing?
2. Given mobile is likely where "people who came to look" most often land, does the photograph deserve more of the lightbox's height than the EXIF card currently claims?
3. The empty state and the "unrecognized city" state say the same thing — is there value in ever telling a visitor their specific link didn't resolve, or does "content pending" framing serve every case equally well?
