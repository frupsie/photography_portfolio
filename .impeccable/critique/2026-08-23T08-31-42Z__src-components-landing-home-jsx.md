---
target: homepage
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-23T08-31-42Z
slug: src-components-landing-home-jsx
---
Method: dual-agent (A: aee107a4d94c1c7dd · B: a41a7152314f58538)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | 3,236px pinned pan, no position cue; index plate keeps last-hover state |
| 2 | Match System / Real World | 3 | Copy plain and human; year column is "2025" 11 of 13 times |
| 3 | User Control and Freedom | 1 | Four screens pinned, no skip; closer CTA points away from the work |
| 4 | Consistency and Standards | 1 | Two type systems in one viewport; 16% of homepage text is Inter |
| 5 | Error Prevention | 2 | Hangzhou row styled as visited, links to an empty page |
| 6 | Recognition Rather Than Recall | 2 | Mobile is 13 bare place names, Kyoto falsely marked active |
| 7 | Flexibility and Efficiency | 1 | 8.8 viewport-heights for 9 photographs, no accelerator |
| 8 | Aesthetic and Minimalist Design | 3 | Real restraint; large unpurposed voids, name outweighs photograph |
| 9 | Error Recovery | 2 | Failed image renders as dark ground under a live caption |
| 10 | Help and Documentation | 2 | Two invented interactions, zero affordance |
| **Total** | | **18/40** | **Poor** |

No n/a used. H7 and H10 kept in scope: the product names a skim-fast audience, and the page invents two non-standard interactions.

## Design Specificity Verdict

Section 3 (the frame strip) is specific to a body of mixed-orientation photographs. Sections 1 and 4 are category-interchangeable. The binding product commitments (EXIF, Singapore, chronology, logbook framing) appear nowhere on the homepage. The hero makes the photographer's name the largest object on a page whose first principle is that photographs lead.

Deterministic scan: zero findings against Home.jsx/Home.css. Three project-wide, all outside target. In-page detector: tight-leading and wide-tracking are false positives (display type / uppercase micro-labels); overused-font Inter at 16% is real and confirms the font clash.

## Priority Issues

- [P0] Nav invisible over hero. Measured 1.42:1 against the actual photograph pixel. Navbar transparent with no backdrop at every scroll position. VERIFIED. (Assessment A's additional claim that the wordmark overlaps the h1 and city names was checked and does NOT reproduce; dropped.)
- [P0] Section 2 incoherent on mobile. order:-1 puts plate above heading; hero and plate are the same file (IMG_0486); Kyoto marked active with no touch cause; 0 of 13 rows carry a thumbnail. VERIFIED.
- [P1] Same photograph three times (hero, plate default, favourite #4).
- [P1] Pan costs 45% of page, no counter, and at 375px every frame is 390px wide in a 375px viewport so none is ever seen whole.
- [P2] Index order is hardcoded and non-chronological; year column near-constant; Hangzhou styled as visited.

## Persona Red Flags

- Casey (mobile): same photograph twice, two screens of text-only rows, every frame clipped.
- Sam (a11y): nav at 1.42:1; 21 of 22 images alt=""; rich alt text unused in cities.js; closer statement is a <p>.
- Skimming art director: 8.8 screens for 9 photographs, no gallery link mid-page, no EXIF anywhere.

## Minor Observations

- STRIP_SIZE/STRIP_DROP length 6 against 9 frames; frames 7-9 replay 1-3.
- 1 em-dash in visible text (footer) against the component's own rule.
- 5 distinct non-zero border-radius values, all from inherited chrome not Home.css.
- PLATE_OVERRIDE comment still says "sandbox-only".
- 22 of 22 images lack width/height.

## Questions to Consider

1. If photographs lead, why is the name the largest element, on a scrim that dims the photograph?
2. Ten photographs, zero EXIF, no mention of logbook/journey/Singapore. Has any binding commitment been honoured on this page?
3. 45% of the page pans nine photographs sideways. As a static grid, what is lost?
4. Both audiences get the same four sections. Unresolved tension, or a compromise failing both?
