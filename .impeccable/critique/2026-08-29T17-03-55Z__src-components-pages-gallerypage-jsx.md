---
target: gallery page
total_score: 24
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-29T17-03-55Z
slug: src-components-pages-gallerypage-jsx
---
Method: dual-agent (A: a76e72ad0081db98b · B: ac5374bc42786a386)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Filter state is loud for sighted users (border+bar+subtitle+tally+URL) but invisible to assistive tech — no `aria-pressed`/`aria-current` on active pills |
| 2 | Match System / Real World | 3/4 | Natural geographic/chronological language; CAM/LNS/EXP abbreviations assume some photo literacy |
| 3 | User Control and Freedom | 2/4 | Browser back while the lightbox is open exits the whole Gallery page — opening it never pushes a history entry |
| 4 | Consistency and Standards | 3/4 | Consistent icon/pill/mono-data language; a single-photo city's lightbox still shows fully-styled, silently-dead Prev/Next |
| 5 | Error Prevention | 2/4 | Dead-end filter pills (0-photo cities) carry no warning before commit; non-functional nav buttons aren't disabled |
| 6 | Recognition Rather Than Recall | 4/4 | Filters always visible, never hidden in a menu; current state shown redundantly four ways at once |
| 7 | Flexibility and Efficiency | n/a | Experience-mode surface — no power-user shortcut is called for here |
| 8 | Aesthetic and Minimalist Design | 4/4 | Photographs genuinely carry the color; chrome stays out of the way — strongest heuristic on the page |
| 9 | Error Recovery | 3/4 | Plain-language empty state, but identical "check back soon" copy covers both a real future city and a garbage URL |
| 10 | Help and Documentation | n/a | Appropriately absent for this surface |
| **Total** | | **24/32** | **75% — Good** |

Two heuristics scored n/a (#7, #10). Note the applicable max differs from the previous run (36, one n/a) — this run's independent assessment judged #7 n/a again as the first run did; the underlying facts aren't in conflict, just which heuristic a given pass judged scoreable.

## Design Specificity Verdict

**LLM assessment**: Grounded in real places where it counts most — the lightbox's EVF corner brackets, mono-font counter, and CAM/LNS/EXP metadata card are genuinely tied to photography-as-craft, and the city→country scroll dividers, built from real EXIF year data, directly execute "the journey is the organizing idea." But the filter-pill row itself (rounded uppercase pills, border-and-underline active state) is a stock e-commerce/blog category-filter pattern, and the grid-hover-caption-on-gradient is one of the most common portfolio-grid conventions there is. Strip the EXIF chrome and dividers and what's left could belong to any travel blog's photo index — specific at the core, generic in its connective tissue.

**Deterministic scan**: Static scan of the two target files clean. Live-DOM injection found 3 hits, but only 1 traces to this page's own code:
- **Real, Gallery-owned**: `.gallery-page__sub`'s `0.06em` letter-spacing — the same borderline finding flagged in both prior runs, still never addressed (always judged low-priority relative to what was in scope each time).
- **False positive**: a `transition: padding-left` hit traces to `.home-index__row` in `Home.css` — confirmed zero such elements exist anywhere in the live `/gallery` DOM; Vite's dev bundle just loads it globally.
- **Not Gallery-owned**: a second `wide-tracking` hit traces to `.footer__copy`, shared chrome rendered on every route via `Footer.jsx`.

**Visual overlays**: injection succeeded and ran live in the page; the live server has since been stopped per required cleanup.

## Overall Impression

Genuinely different findings than the last two runs, not a rerun — this pass looked at edges the previous ones didn't reach (browser back with the lightbox open, single-photo cities, assistive-tech state announcement) and found real gaps in all three. The core browsing experience keeps improving; what's left is mostly in the seams — history behavior, AT semantics, small dead-end states — rather than the structural gaps earlier runs found.

## What's Working

- **URL-as-source-of-truth filtering, verified end-to-end**: a hard navigation to `/gallery?country=Japan&city=Kyoto` restores both active pills, the correct subtitle, and the correct tally with no client state loss. Refresh, deep-link, and back/forward (within a filter) all just work.
- **Lightbox focus management**: opening moves focus to the close button; Tab is trapped and wraps correctly both directions; Escape closes and returns focus to the exact grid tile that opened it.
- **Dividers double as content structure and accessibility structure**: the h1→h2(country)→h3(city) heading outline gives a screen-reader user the same "where am I in the journey" cue a sighted visitor gets from the accent-colored headers — one piece of work serving both goals.

## Priority Issues

**[P1] No semantic active-state on filter pills for assistive tech**
Why it matters: a screen-reader user tabbing "All / China / Japan / South Korea" hears four identical, unstated buttons — the current filter is only announced if they separately locate the subtitle text. Fails Visibility of System Status and Recognition Rather Than Recall for AT users specifically.
Fix: add `aria-pressed={active}` to `FilterPill`.
Suggested command: `/impeccable harden`

**[P1] Filter chunking exceeds the ≤4 guideline and will keep growing**
Why it matters: China's and Japan's city sub-rows already show 6 cities flat in one row each — flagged in both prior critique runs and still unaddressed. The product explicitly expects new cities to arrive "in bursts," so this gap only widens over time without a deliberate decision.
Fix: a deliberate choice — grouping, a "show all" truncation, or consciously accepting the flat list — rather than default growth.
Suggested command: `/impeccable layout`

**[P2] Browser back exits the whole Gallery page while the lightbox is open**
Why it matters: verified directly — opening the lightbox never pushes a history entry, so a back press (or an OS back-gesture on mobile) lands on whatever page preceded Gallery entirely, silently dropping the lightbox and the active filter both. Breaks the natural "back closes what's covering the screen" model this exact class of bug was partly fixed for earlier — that fix covered a *filter* changing underneath an open lightbox; this is the more common first-order case of the lightbox never registering as a navigable state at all.
Fix: push a lightweight history entry (or `?photo=` param) when the lightbox opens.
Suggested command: `/impeccable harden`

**[P2] Lightbox close button is 34×34px on mobile**
Why it matters: measured directly — smaller than prev/next (40×40) and the main filter pills (40px tall), in a harder-to-reach corner, on the control that matters most when a visitor wants out of a full-screen view. This size was never touched by the earlier mobile-lightbox work, which added visibility (a solid chip background) to all three buttons but not size to this one.
Fix: raise to 44×44px, or pad the invisible hit area the way `.ap-social-link` already does elsewhere in this same stylesheet.
Suggested command: `/impeccable harden`

**[P3] Single-photo cities show dead Prev/Next controls**
Why it matters: filtering to Macau (1 photo) and opening the lightbox shows "01/01" with fully-styled, clickable chevrons that do nothing on press — no shake, no disabled state, no feedback. Every other lightbox interaction trains the visitor that these controls do something; here they silently don't, right where the surrounding polish sets a high bar for what "broken" would even look like.
Fix: hide or disable prev/next when `photos.length <= 1`.
Suggested command: `/impeccable polish`

## Persona Red Flags

**Sam (Accessibility-Dependent)** — no `aria-pressed`/`aria-current` on active filter pills (P1 above); genuine strength credited on focus-trap/focus-restore, both verified working correctly.

**Casey (Distracted Mobile User)** — the 34×34px close button (P2) is the single worst target on the page, on the highest-stakes control; filter pills measure 40px (under the 44px comfort target, though above WCAG's 24px hard minimum); the dense mobile grid gives no city/country label until she taps in, since the desktop hover caption has no mobile equivalent.

**Riley (Deliberate Stress Tester)** — browser-back-exits-page (P2) was the first thing found; but genuine strengths too: rapid-clicking 5 tiles in succession lands cleanly on the last one with no ghost overlays; hard refresh mid-filter fully restores state; an 89-character unrecognized city string produces zero horizontal overflow at any width.

## Minor Observations

- A stray debug-overlay artifact was present in the live DOM during testing (leftover from the detector injection itself) — not shipped code, removed before further inspection, flagged only so it's confirmed not wired into any production path.
- Macau's single photo gets the identical divider treatment as a 15-photo city — proportionally heavier chrome than the one photo underneath it.
- Empty-state copy ("No photos yet for X. Check back soon.") is identical for a real, intentionally-empty city and a garbage/mistyped URL — honest for one, slightly misleading for the other.
- The desktop hover caption repeats city/country info the divider heading directly above already gives — mildly redundant, though harmless.

## Questions to Consider

1. If the filter pills vanished and "the journey" were purely the scroll-and-divider structure, would anyone reach for a filter — or does the logbook framing already solve the navigation problem the pills exist to solve?
2. Every city gets identical visual weight in both the filter row and the divider treatment regardless of whether it holds 1 photo or 19 — does flattening that distinction quietly undersell the deeper collections?
3. The lightbox's EVF chrome is the most specific, most "this is a photographer's site" decision on the page; the filter pills are the most generic. What would the filter row look like if it borrowed that same visual language instead of a stock pill?
