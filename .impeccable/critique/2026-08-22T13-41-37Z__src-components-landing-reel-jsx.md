---
target: homepage
total_score: 17
max_score: 36
na_heuristics: 10
p0_count: 2
p1_count: 2
timestamp: 2026-08-22T13-41-37Z
slug: src-components-landing-reel-jsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

# Homepage critique — `/` · Experience surface

## Design Health Score — 17/36 (Poor, 47%)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Intro progress bar is a fixed 2400ms timer, not real loading. ~760px black gaps between acts read as broken. |
| 2 | Match System / Real World | 3 | Authentic photographer vocabulary, undercut by an intro HUD showing invented EXIF. |
| 3 | User Control and Freedom | 1 | 4.15s forced intro; exit is 9.6px at 35% opacity. Zero prefers-reduced-motion. 8206px linear scroll. |
| 4 | Consistency and Standards | 2 | Act 3 gallery link is a raw <a> (full reload) vs Act 4 <Link>. Three nav surfaces repeat the same triad. |
| 5 | Error Prevention | 2 | .back-to-top (z-2100) floats over the open lightbox (z-1000). |
| 6 | Recognition Rather Than Recall | 2 | "click any frame" hint fades at 10% of act; cells have no hover state. |
| 7 | Flexibility and Efficiency | 1 | No express lane, no keyboard route to any photograph. Scored (not n/a) because PRODUCT.md names a fast-skimming client audience. |
| 8 | Aesthetic and Minimalist Design | 3 | Genuine chrome restraint; costs a point for Act 2's pale basemap and intro HUD density. |
| 9 | Error Recovery | 1 | Act 2 depends on a third-party CDN; .reel__map-fallback is an empty div. |
| 10 | Help and Documentation | n/a | Inapplicable on an Experience surface. |

## Design Specificity Verdict

Vocabulary is product-specific; composition is category-interchangeable. Acts 1, 2 and 4 could belong to any agency site. Act 4 uses photographs as wallpaper behind nav labels at 88% black, inverting Principle 1.

Arithmetic problem: a logbook of 129 photographs across 13 cities shows 9 distinct images on its homepage, 4 of which appear twice, rendered at 95x63px, while a third-party basemap gets the full viewport.

Deterministic scan: CLI returned 0 findings across 11 files, but control tests proved the scanner catches only ~1 in 5 seeded anti-patterns for this architecture (regex on JSX; never resolves App.css). Live DOM scan returned 14 findings, all warning:
- undersized-ui-text x6 (9.6-9.92px: "Scroll", 3 counter labels, "Across Asia", "Step inside")
- wide-tracking x4 (.reel__act3-hint, .cta-tile__sub x2, .footer__copy)
- kicker-above-heading x2 ("Selected work", "Step inside")
- overused-font x1 (Inter, 83% of text)
- layout-transition x1 (transition: width)

Agreement: both methods independently identified systematically undersized micro-text.
Detector-only finds: overused-font, layout-transition, kicker pattern.
False positives: wide-tracking on .reel__act3-hint and .footer__copy (tracked micro-labels misclassified as body copy via tag); .reel__act3-hint scanned while hidden.

## What's Working

1. PhotoLightbox + ExifCard — the only fully-realised expression of the product. Real capture data in the site's own EVF vocabulary, keyboard arrows and Escape working.
2. Act 3 sheet-plus-stage as a concept — body of work and single frame visible at once; a real structural answer to "one surface, two speeds". scrub:0.3 rather than 1 is a correct call given Lenis already eases ~1.1s.
3. Chrome restraint in dark passages — 0.22 HUD opacity, single muted gold (#a89070, 6.8:1).

## Priority Issues

[P0] Act 2 ships Carto Voyager (light basemap), breaking the binding dark-palette commitment. 1670px / 20% of desktop scroll is cream and powder-blue with country labels brighter than the section heading. Fix: swap tile URL to dark_all. Command: /impeccable colorize

[P0] IntroScreen has zero prefers-reduced-motion handling and fires a 70ms full-viewport near-white flash on a near-black page. Only escape is a 9.6px 35%-opacity skip (~44x18px). Fix: gate the component; make skip a real 44x44 control. Command: /impeccable harden

[P1] Photographs are the smallest elements on the page. Sheet cells 95x63px inside a stage allowed 547px; .sheet__num 8px unreadable; 9 of 129 images, 4 repeated. Mobile: Act 3 is 10% of page vs 29% each for hero and map. Fix: raise .sheet__grid so cells reach ~200px; grow featured.js past 9 (COLUMNS scales as sqrt(pool)). Command: /impeccable layout

[P1] Primary interaction keyboard-unreachable and unstable by mouse. Sheet cells are plain figure+onClick (no role, tabindex, or key handler). Act 2 passive map leaves 13 unlabeled markers tabbable. Lightbox does not lock scroll (page moved 3600->4600px behind an open dialog), no role=dialog, no focus move, and .back-to-top renders above it. Command: /impeccable audit

[P2] Intro fabricates camera data contradicting the site's own EXIF. HUD reads 1/500 F1.8 ISO 400 CF-A; the photo behind it is a Canon EOS RP at 1/400, f/6.3, ISO 100, and the RP takes SD not CF. Fix: read real EXIF from photo-meta.js. Command: /impeccable clarify

## Persona Red Flags

Jordan (first-timer): 4.15s forced intro with a near-invisible exit. .reel__scroll-hint computes to ~1.2:1 contrast. The ~760px black gap after Act 2 is the most likely abandonment point. Never learns frames are clickable.

Casey (mobile): downloads ~1.7MB of photographs CSS has hidden (.sheet__stage display:none below 768px but the img elements still fetch). Work is 10% of her page. .back-to-top is 40x40px, under the 44px minimum, and sits over the lightbox. Copy says "click".

Mara (photo editor, ~50s, derived from PRODUCT.md's client audience): cannot assess range from 9 thumbnails at 95px; the shuffle reseeds per load so no photograph can be cited in a forwarded link.

## Minor Observations

- Act3Work.jsx uses raw <a href="/gallery"> — full page reload on the primary route
- "Let's make something" implies a practice PRODUCT.md says does not exist
- About tile photo reads as Rome, confusing the Asia geography
- Reduced-motion block sets scroll-snap-type on a non-scroll-container — inert
- Navbar.jsx and Footer.jsx use raw window.scrollTo while Lenis drives scroll — latent
- Act 1 hero carries alt="" — opening image invisible to screen readers

## Questions to Consider

- Why do only 9 of 129 photographs appear, 4 twice, while the largest object is a third-party basemap?
- What if Act 2 and Act 3 were one act, where the pins are the thumbnails?
- What would the page look like if every number on it were true?
- PRODUCT.md says the four-act concept is not binding. If Acts 1, 2 and 4 were deleted and only the contact sheet remained at full size with 25 frames, what would be lost?
