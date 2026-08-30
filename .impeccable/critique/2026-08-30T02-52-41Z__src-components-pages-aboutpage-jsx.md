---
target: about page
total_score: 28
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-30T02-52-41Z
slug: src-components-pages-aboutpage-jsx
---
Method: dual-agent (A: ac06922db04adc498 · B: a3356509943d479a4)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Lazy-loaded candids pop in with no loading affordance; minor |
| 2 | Match System / Real World | 4 | Real EXIF vocabulary, real gear names, real workflow terms |
| 3 | User Control and Freedom | 4 | External link handled safely, no traps |
| 4 | Consistency and Standards | 4 | Button/link/focus-visible patterns now reuse the site's shared conventions |
| 5 | Error Prevention | 4 | Nothing risky exposed |
| 6 | Recognition Rather Than Recall | 2 | "5 Camera Bodies" vs 3-listed bodies still forces reconciliation; the disclaimer added to fix this fails contrast |
| 7 | Flexibility and Efficiency | n/a | No power-user path applies |
| 8 | Aesthetic and Minimalist Design | 4 | Restrained palette, clear scale |
| 9 | Error Recovery | 3 | No real error states exercised; good alt text degrades gracefully |
| 10 | Help and Documentation | n/a | Not applicable |
| **Total** | | **28/32** | **Good (87.5%)** |

## Design Specificity Verdict

~80% of the page is genuinely grounded in this product. Workflow remains the one stock section, out of scope this pass.

Deterministic scan: CLI clean. Browser DOM scan found 5 anti-patterns: hero-eyebrow-chip (false positive, plain text not a chip), tiny-text 11.52px (real — my own regression: .ap-stats-exif__note, the caption added last pass, is long body copy under the 12px floor for that rule), wide-tracking 0.10em (real, pre-existing, traced to .ap-social-link), gpt-thin-border-wide-shadow (traced to sitewide .back-to-top button, out of scope, standard elevation shadow), layout-transition "padding-left" (unconfirmed on two independent passes now, could not trace to any element).

## Overall Impression

Every fix from the last pass held up under independent re-review except one: the caption written to fix the Camera Bodies contradiction fixes the content problem but introduces two new legibility problems (contrast 3.38:1, size 11.52px vs 12px floor for its text length) — a self-inflicted regression. This round also surfaced pre-existing issues a more accessibility-focused pass caught: no heading structure over the page's densest content block, and an identical opacity-stacking contrast bug on the Workflow step numbers.

## What's Working

- Alt text ahead of the site's own documented gap — specific, non-generic descriptions on all three About images.
- Mobile gear-note fix confirmed well executed on the worst case (long Sigma lens name) — clean wrap, nothing truncated.
- Focus and reduced-motion confirmed properly implemented via real Tab presses and initial:false (not just a zeroed duration).

## Priority Issues

**[P1] The Camera Bodies disclaimer fails both contrast and size — a self-inflicted regression**
.ap-stats-exif__note: opacity 0.75 on text-muted computes to 3.38:1 (needs 4.5:1); 11.52px is under the 12px floor for its 75-character length.
Fix: drop the opacity, bump size to 12px+ or fold into .ap-bio's treatment.

**[P1] No heading or landmark label over the page's most content-dense block**
ap-hero/ap-about/ap-gear/ap-workflow are unlabeled sections; heading nav jumps straight from h1 to "The Kit" h2, skipping bio, stats, EXIF strip, and both CTAs.
Fix: aria-label on each section plus a visually-hidden h2 over the bio block.

**[P2] Same opacity-stacking contrast bug on the Workflow step numbers**
.ap-workflow__num: opacity 0.75 on accent computes to 3.97:1, under the floor for real text content ("01"-"04").
Fix: remove/reduce the opacity or lighten the base color.

**[P2] Orphaned separator dots when the EXIF strip wraps on mobile**
.ap-stats-exif__sep doesn't hide when items stack at 375px, leaving a dangling dot before the line break.
Fix: display:none on the separator under the stacking width.

**[P3] No restated call-to-action after the deepest content**
The most-persuaded reader (who scrolls through Gear/Workflow) lands in the generic Footer with no repeated invitation to act.
Fix: repeat a lightweight CTA after Workflow. (Deferred by user — content/design addition, not a bug fix.)

## Persona Red Flags

Jordan: hits the Camera Bodies mismatch right after the trust-building stats, disclaimer confirmed hard to read.
Sam: heading/landmark gap and both contrast failures land directly here, plus .ap-gear__items list-style:none with no role="list" restated (WebKit/VoiceOver drops implicit list role).
Casey: orphaned separator dots are exactly the kind of miss a phone user notices in line-wraps.

## Minor Observations

- Hero eyebrow (0.7rem, 0.28em tracking) passes contrast fine, no action needed.
- Candid photo paths hardcoded in JSX rather than data-derived — maintenance note, not a UX defect.
- usePortfolioStats caches in a module-level singleton with no invalidation — fine for a static build.

## Questions to Consider

- What if "5 Camera Bodies" showed "+2 retired" right next to the stat itself instead of a separate sentence below the strip?
- What if Workflow used one of the 129 real photos to walk through this photographer's actual process instead of a generic four-step sequence?
