---
target: about page
total_score: 24
max_score: 28
na_heuristics: 7,9,10
p0_count: 0
p1_count: 3
timestamp: 2026-08-30T02-30-14Z
slug: src-components-pages-aboutpage-jsx
---
Method: dual-agent (A: a7896092a32ccca90 · B: a2ec3ac54841e702c)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Hover feedback on the CTA is well-built; focus feedback on the same control is missing |
| 2 | Match System / Real World | 3 | "5 Camera Bodies" stat contradicts the 3-body Kit list on the same page |
| 3 | User Control and Freedom | 4 | Simple linear scroll, back-to-top present, no traps |
| 4 | Consistency and Standards | 2 | Focus-visible treatment used everywhere else on the site is absent on this page's own primary CTA and social link; stat contradicts Kit list |
| 5 | Error Prevention | 4 | External link correctly uses rel="noopener noreferrer"; no forms/destructive actions |
| 6 | Recognition Rather Than Recall | 4 | Every number is labeled; no memory demands beyond the stat/Kit mismatch |
| 7 | Flexibility and Efficiency | n/a | No power-user path applies to a static About page |
| 8 | Aesthetic and Minimalist Design | 4 | Restrained palette, generous whitespace, consistent scale — strongest heuristic here |
| 9 | Error Recovery | n/a | No error states possible |
| 10 | Help and Documentation | n/a | Not applicable to a portfolio About page |
| **Total** | | **24/28** | **Good (86%)** |

## Design Specificity Verdict

**LLM assessment**: The section skeleton — hero → photo+bio → animated stats → EXIF strip → CTA pair → gear list → process steps — is a template shape any creative freelancer's About page could reuse unchanged. What actually anchors it to this product is the content on top of that skeleton: EXIF-derived numbers pulled live from photo-meta.js/cities.js, a real gear list with genuine use-case notes, and a documented, deliberate choice to give the candid photos no hover-zoom or lightbox — texture beside the portrait, not a second gallery, matching the "logbook first" principle directly. The Workflow section (Shoot RAW → Cull → Grade → Export) is the one block that's genuinely generic.

**Deterministic scan**: detect.mjs CLI mode on the source file: clean ([]). The browser-injected DOM scan found 15 anti-patterns: undersized-ui-text ×12 (labels at 9.92–10.88px), hero-eyebrow-chip ×1, wide-tracking ×1, layout-transition ×1.

**False positives / uncertain findings**: hero-eyebrow-chip is a naming mismatch — .ap-hero__eyebrow has no background/border/padding, it's plain tracked text, not a pill/badge. layout-transition ("transition: padding-left") could not be traced to a specific source line — flagged unconfirmed. wide-tracking (0.28em on the hero eyebrow) is real and wider than the rest of the site's own convention (0.1–0.18em elsewhere).

The undersized-ui-text finding deserves weight despite its detector-only origin: this exact defect class was already fixed once this session on .exif-card__label because it was hard to read — the fix hasn't propagated to this page's own labels yet.

## Overall Impression

Real work — restrained, on-brand, carried by genuine data rather than fabricated claims. The single biggest issue: the page contradicts itself. The EXIF strip's "5 Camera Bodies" stat doesn't match the 3 bodies listed in "The Kit" a few hundred pixels down, on the one page whose job is to make a prospective client trust the numbers.

## What's Working

- Deliberate restraint on the candid photos — documented in code as texture beside the portrait, not a second gallery, straight from "logbook first."
- The two-path CTA design — "Get in Touch" (primary) beside "Follow on Instagram" (secondary), visual weight matching intended commitment level.
- Single-source-of-truth data — stats/EXIF compute live from cities.js/photo-meta.js rather than being hand-typed.

## Priority Issues

**[P1] The headline "5 Camera Bodies" stat contradicts the Kit list on the same page**
Why it matters: PRODUCT.md names "judge range/consistency quickly" as core to the prospective-client audience. A self-contradiction on the credibility page undercuts trust.
Fix: add the 2 legacy bodies to the Kit list under an "Archive" note, change the stat to count current gear only, or caption the EXIF strip ("across the full archive").
Suggested command: /impeccable clarify

**[P1] The page's own primary CTA and social link lack the site's own focus-visible treatment**
Why it matters: .ap-contact-btn has :hover but no :focus-visible at all; .ap-social-link:focus-visible only changes text color, not the outline used everywhere else on the site (including the footer's copy of the same Instagram link). This exact gap was already fixed elsewhere this session.
Fix: add outline: 2px solid var(--accent); outline-offset: 2px on :focus-visible for both.
Suggested command: /impeccable harden

**[P1] prefers-reduced-motion is not respected on this page**
Why it matters: PRODUCT.md states this is respected sitewide; the only reduced-motion media query in App.css is scoped to .skip-link. ~15 fade-up elements and 3 count-ups run unconditionally.
Fix: gate fadeUp and CountUp behind the existing useMatchMedia('(prefers-reduced-motion: reduce)') hook already used in Home.jsx/PhotoLightbox.jsx.
Suggested command: /impeccable harden

**[P2] Twelve tracked-caps labels render under an 11px legibility floor**
Why it matters: same defect class already fixed once this session on .exif-card__label. ap-stats-exif__label (9.92px), ap-gear__heading (10.88px), ap-workflow__num/__label (10.88px) never got the same treatment.
Fix: bump to roughly the 0.68–0.7rem range the rest of the site's labels settled on.
Suggested command: /impeccable typeset

**[P2] Gear-item notes disappear entirely below 768px**
Why it matters: .ap-gear__item-note { display: none } on mobile removes every use-case description, for exactly the skim-fast, phone-first persona PRODUCT.md calls out.
Fix: stack name-above-note in a single column below 768px instead of hiding the note.
Suggested command: /impeccable adapt

## Persona Red Flags

**Jordan (first-timer)**: all three photos of Jayden face away, are obscured by a camera, or sit in shadow — no direct "this is me" moment. Longest bio paragraph is abstract musing rather than personal.

**Sam (accessibility-dependent)**: the two P1 a11y findings above, plus .ap-workflow__arrow and the contact button's chevron SVG lacking aria-hidden="true", unlike every other decorative icon on this page.

**Casey (distracted, mobile)**: the vanishing gear notes hit this persona hardest.

## Minor Observations

- No heading precedes the bio/stats/actions block — screen-reader heading navigation jumps from h1 straight to "The Kit" h2.
- Stats initialize at literal 0 before count-up runs, no static fallback.
- Instagram link opens in a new tab with no "opens externally" cue.
- Hero eyebrow's 0.28em letter-spacing is wider than the rest of the site's convention (0.1–0.18em).

## Questions to Consider

- What if the Camera Bodies stat and the Kit list were the same list — one source of truth?
- What if the Workflow section were replaced with something tied to a specific photo instead of a generic four-step process?
- What if the CTA reappeared, quieter, after Workflow, so a visitor who reads everything doesn't have to scroll back up?
