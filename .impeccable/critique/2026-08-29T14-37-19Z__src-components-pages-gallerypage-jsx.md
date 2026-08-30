---
target: gallery page
total_score: 30
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-08-29T14-37-19Z
slug: src-components-pages-gallerypage-jsx
---
Method: dual-agent (A: a587bb59def2352e8 · B: a524e73c15969cd6f)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Tally and active pill are always accurate; the subtitle ("All photos across Asia") never updates when filtered |
| 2 | Match System / Real World | 4/4 | Country→city, EXIF vocabulary, and journey-chronology framing all match how a photographer actually organizes work |
| 3 | User Control and Freedom | 3/4 | Excellent on desktop (Escape, backdrop-click, focus-return all verified live); degraded on mobile, where the only exit from a photo besides tapping is barely visible and swipe doesn't exist |
| 4 | Consistency and Standards | 4/4 | Real `<button>`s throughout, one pill style at two tiers, `ExifCard` shared with the homepage |
| 5 | Error Prevention | 3/4 | 0-photo/1-photo states handled gracefully; no forewarning at the pill level that a city is empty before clicking it |
| 6 | Recognition Rather Than Recall | 3/4 | Scroll dividers now give constant place/chronology context (up from the last run); EXIF abbreviations (CAM/LNS/EXP) still lean on photographer-domain recall |
| 7 | Flexibility and Efficiency | 3/4 | Arrow-key/Escape shortcuts work; filter state isn't in the URL — refresh, back-button, or a shared link always drops back to unfiltered "All" |
| 8 | Aesthetic and Minimalist Design | 4/4 | Near-black ground, sparing gold accent, no decorative clutter |
| 9 | Error Recovery | 3/4 | The one real error-like state (empty filter) is calm and on-brand, but offers no one-click way back to "All" |
| 10 | Help and Documentation | n/a | No task here complex enough to need it |
| **Total** | | **30/36** | **83% — Good** |

One heuristic scored n/a (#10) under this surface's Experience mode. Note the applicable max changed from 32 (previous run) to 36 — this run's independent assessment judged #7 scoreable where the last one didn't; scores aren't a strict like-for-like on that one row, but the underlying finding (filter state not in the URL) is the same fact both times.

## Design Specificity Verdict

**LLM assessment**: Grounded in a specific product, not a reskinned generic gallery. The lightbox's EVF-style corner brackets, mono frame-counter, and CAM/LNS/EXP metadata card pulling real camera/lens/exposure data are all specific to "this is a photographer's logbook." The two-tier country→city filter and the city/country scroll dividers (with year) now directly encode "the journey is the organizing idea" — a real change from the previous run, where that idea lived only in the filter row above an undifferentiated wall.

**Deterministic scan**: Static scan of the two JSX files clean (exit 0, `[]`). Live-DOM injection found 132 hits, all traceable to 3 root causes:
- **Real, gallery-owned, unaddressed**: `.gallery-item__country` still renders at 10.88px (`App.css:1952`), under the 11px floor — 129 hits, one per photo, same single CSS rule as the previous run. This was flagged then and never fixed (out of the scope the user chose to run).
- **Real but borderline**: `.gallery-page__sub`'s `0.06em` letter-spacing — same minor finding as before, still standing.
- **False positive for this target**: a second `wide-tracking` hit traces to `Footer.jsx`, rendered outside `<Routes>` on every page — not Gallery-owned.
- **Likely a tooling artifact, not a site defect**: a `layout-transition` hit on `transition: padding-left` on `BODY`. Assessment B grepped the entire `src/` tree for any transition rule that could produce this and found none; live `getComputedStyle` showed a zero-duration `transition: all` that authors nothing in source. Treating this as noise, not a real finding.

**Visual overlays**: injection succeeded and ran live in the page; the live server has since been stopped per required cleanup.

## Overall Impression

Genuinely improved since the last run. The one structural gap that mattered most — a flagship browsing view with no sense of place — is fixed, and fixed in a way that reaches keyboard/screen-reader users too, not just sighted ones. The page's ceiling is still the lightbox's specificity; its floor is now mobile, where the same craft evaporates. A visitor on the device most social-referred traffic actually uses gets a photo rendered at under a third of their screen height, flanked by navigation controls that are there but not visible.

## What's Working

- **Scroll dividers with adaptive heading levels** — verified live: heading level correctly follows what's actually in the document (h2 for country, h2-or-h3 for city depending on whether a country h2 already exists above it), so a screen-reader user can jump this 129-photo wall by heading exactly as a sighted user scans it by eye. Directly resolves a gap flagged in the previous critique.
- **Lightbox focus discipline** — Escape/backdrop-click return keyboard focus to the exact tile that opened it, and the hover caption overlay mirrors on `:focus-visible`, giving keyboard users the same "which photo is this" cue mouse users get on hover.
- **EVF/EXIF chrome** remains the single most product-specific, well-crafted moment on the site — real camera/lens/exposure data in a viewfinder-styled frame.

## Priority Issues

**[P1] The photo itself is the smallest thing on the mobile lightbox screen**
*Why it matters*: measured live at 375×812 — a landscape photo renders at 360×240px, under 30% of viewport height, with 500px+ of empty black space around it because the layout width-caps the image without accounting for how short that makes it. PRODUCT.md's own principle #1 ("the photographs lead") is inverted here: on mobile it's empty void that dominates, not the photograph, on exactly the device most visitors arrive on.
*Fix*: let landscape images grow toward available height on tall/narrow viewports instead of being width-capped and center-starved.
*Suggested command*: `/impeccable layout`

**[P1] Mobile lightbox navigation is effectively invisible, and there's no swipe**
*Why it matters*: prev/next controls sit almost flush against the photo with only a 16%-opacity border and no fill — confirmed correctly positioned in the DOM but not visually perceptible in a screenshot. No touch/drag handler exists in `PhotoLightbox.jsx` at all, so arrow keys are the only non-tap navigation, and arrow keys don't exist on a touchscreen. A visitor who can't find how to advance past photo 1 of 46 stops there.
*Fix*: solid dark chip background for the buttons on mobile, plus horizontal drag/swipe (Framer Motion already in the stack — `drag="x"` with an `onDragEnd` threshold).
*Suggested command*: `/impeccable polish`

**[P2] Filter state isn't in the URL, and the subtitle goes stale**
*Why it matters*: confirmed in code — `selCountry`/`selCity` are plain `useState`, refresh/back/a shared link always reset to unfiltered "All." Separately, `<p className="gallery-page__sub">All photos across Asia</p>` is a hardcoded string that never updates — a visitor filtered down to Macau's one photo still reads "All photos across Asia" a few pixels above a tally that contradicts it.
*Fix*: sync filter state to `?country=&city=`; derive the subtitle from `activeLabel`.
*Suggested command*: `/impeccable harden`

**[P2] Keyboard focus can scroll a heading behind the fixed navbar**
*Why it matters*: tabbing from the filter pills into the grid triggers the browser's native scroll-into-view; at the resulting scroll position the page's own `<h1>Gallery</h1>` renders partially behind the fixed, opaque navbar — confirmed via bounding-rect math and a screenshot. A keyboard user loses a heading landmark a mouse-scrolling visitor never loses this way.
*Fix*: reserve `scroll-margin-top` (matching the navbar's height) on the heading/section so native focus-scroll stops clear of the fixed bar.
*Suggested command*: `/impeccable harden`

**[P2] Country-label captions are still under the legibility floor**
*Why it matters*: `.gallery-item__country` is 10.88px, detector-confirmed again this run — flagged in the previous critique and not addressed, since the fix work that shipped between runs was explicitly scoped to the journey-structure issue only.
*Fix*: bump `.gallery-item__country` to at least 11px; check `.gallery-item__city` alongside it.
*Suggested command*: `/impeccable typeset`

## Persona Red Flags

**Casey (Distracted Mobile User)**
- Lightbox prev/next controls are visually imperceptible at 375px, no swipe gesture exists.
- City sub-row pills measured 34px tall — under comfortable thumb size, right where Casey is trying to pick one city among six siblings.
- The photo she came to judge renders at ~240px tall on an 812px screen.

**Sam (Accessibility-Dependent)**
- Genuine strengths credited above (focus-return, adaptive heading levels).
- Freshly focusing into the grid can land the page's own `<h1>` partially behind the fixed navbar (P2 above).
- EXIF field labels (CAM/LNS/EXP) have no expansion for assistive tech — a screen reader reads "EXP, 1/250 · f/10 · ISO 200 · 105mm" with no indication what "EXP" stands for.

**Riley (Deliberate Stress Tester)**
- 0-photo (Hangzhou) and 1-photo (Macau) cases both verified live and handled correctly — friendly empty-state copy, correct singular/plural grammar.
- Refresh or back-button after filtering silently discards the filter — not a crash, but a real, verifiable state-loss surprise (ties to the P2 above).

## Minor Observations

- China and Japan's city sub-rows still show 6 pills each, over the ≤4 chunking guideline — the same finding from the previous run, still unaddressed, will only grow as cities are added.
- No closing beat at the end of the 19,400px scroll — the last row runs straight into the footer with no acknowledgment the journey (so far) is complete, an unfinished note after the lightbox's strong peak.
- Hangzhou (0 photos) is selectable with no visual distinction from populated cities — likely an intentional "more coming" teaser, worth confirming it's deliberate rather than accidental.
- Country-divider padding (44px) vs. city-divider (28px) creates a genuinely legible, intentional-feeling rhythm break at country boundaries — holding up well under a second look.

## Questions to Consider

1. The richest, most specific craft on this whole page is the lightbox's EVF/EXIF chrome — why does that investment evaporate on mobile, the device most social-referred visitors will actually be using?
2. If a prospective client wants to send a colleague straight to "just the Tokyo work," what do they send today?
3. If "the journey is the organizing idea," what should arriving at the end of it feel like — is a bare footer the right answer?
4. At what city count does the flat pill-row filter need a different shape — and per this repo's own staging convention, would that get built in `src/components/sandbox/` before it ever touches the live page?
