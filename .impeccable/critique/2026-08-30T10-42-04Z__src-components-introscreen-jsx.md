---
target: intro loading screen
total_score: 14
max_score: 32
na_heuristics: 9,10
p0_count: 2
p1_count: 2
timestamp: 2026-08-30T10-42-04Z
slug: src-components-introscreen-jsx
---
Method: dual-agent (A: af7adf6270cd659da · B: ac2e4d85f28f2a81f)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Percentage bar and SEARCHING/LOCK ON are pure theater, no real load coupling |
| 2 | Match System / Real World | 3 | Strong EVF metaphor, docked for fabricated EXIF |
| 3 | User Control and Freedom | 1 | Skip contrast ~1.76:1, roughly a third of WCAG floor |
| 4 | Consistency and Standards | 2 | Only primary control on site missing the audited focus-visible treatment |
| 5 | Error Prevention | 3 | Nothing destructive |
| 6 | Recognition Rather Than Recall | 1 | Skip discoverability fails; code's own comment concedes it |
| 7 | Flexibility and Efficiency | 1 | Repeat visitor gets zero benefit, replays every session |
| 8 | Aesthetic and Minimalist Design | 2 | Nine chrome groups arrive at once on a screen meant to end quickly |
| 9 | Error Recovery | n/a | No error states possible |
| 10 | Help and Documentation | n/a | Not applicable |
| **Total** | | **14/32** | **Poor (44%)** |

## Design Specificity Verdict

Genuine, specific camera-EVF craft (3:2 lock, rule-of-thirds grid, AF dot grid, exposure meter) — not generic loading chrome. But it hardcodes invented EXIF (1/500, F1.8, ISO 400, 1724 shots) styled identically to the real per-photo EXIF shown everywhere else on the site, undercutting the "truthful over impressive" principle in the visitor's first four seconds.

Deterministic scan: CLI clean. Browser scan (via exposed impeccableScan(), not just passive console) found 9 intro-scoped anti-patterns desktop, 19 at 375px mobile (clamp-sized text bottoming below 11px floor at narrow viewports): topbar-wb, af-status (SEARCHING), bottombar-quality, exp-label x2, card-label, loading-pct, skip button, plus mobile-only exposure values/ticks.

False positive: clipped-overflow-container on .intro (overflow:hidden on a fixed full-viewport backdrop) is correct practice for a full-screen overlay, not a bug.

## Overall Impression

Real craft, wrong job. Decorative regardless of readiness (hero image loaded in ~60ms while the screen ran its fixed 4.15s schedule anyway), its one exit is nearly invisible, and it opens the site contradicting its own truthfulness principle. Lowest score of any critique this session, and earned.

## What's Working

- Metaphor commitment: correct camera-UI details assembled with real attention.
- Shutter/flash as the hand-off device: clever, on-brand, cheap to run.
- Reduced-motion handling reasons through the real vestibular/photosensitivity risk and skips the whole sequence rather than a half-hearted calm variant.

## Priority Issues

**[P0] Skip control fails contrast by roughly a third of the WCAG floor**
rgba(168,144,112,0.35) on #0c0b0a, ~1.76:1 against 4.5:1 AA. Code's own comment concedes it. Fix: raise resting contrast to AA.

**[P0] Sequence is purely time-based, measures nothing real**
Hardcoded setTimeouts; hero image loaded in ~60ms while the sequence ran its fixed schedule regardless. Fix: couple to real readiness, or stop implying it's loading status at all.

**[P1] Fabricated EXIF HUD contradicts "truthful over impressive"**
Invented 1/500, F1.8, ISO 400, 1724 shots in the same visual language as real EXIF shown elsewhere. Fix: strip the specific numbers or source them from the real hero photo.

**[P1] sessionStorage means every new session pays full cost again**
No acknowledgment of familiarity for a repeat visitor. Fix: switch to localStorage, plays once per visitor not once per session.

**[P2] Skip button missing focus-visible; sub-44px touch target**
No :focus-visible rule (every other primary control on the site got this treatment this session); measured 64.6x35px on mobile. Fix: add the standard outline treatment, pad hit area to 44px.

## Persona Red Flags

Alex: pays full cost every session, no shortcut for familiarity.
Casey: fake loading indicator plus sub-44px target on mobile; real hero image might genuinely not be ready when the fake sequence times out anyway.
Sam: reduced-motion path well-reasoned, but visual-contrast-dependent users get an unreadable skip control with no distinguishing focus state.

## Minor Observations

- Enter/Space activation of skip button inconclusive in testing (tool limitation, fairly control-tested) — worth a manual check.
- "1724"/"CF-A" never change across visits, undermining the illusion on repeat viewing.
- The loading-percentage bar is the only genuinely informative element and also the smallest/dimmest/most peripheral.
- Nine chrome groups animate in within ~180ms, nothing progressively discloses.

## Questions to Consider

- What if the ~4 seconds were spent letting the real hero photo load and crossfade in with the same shutter/flash grammar, so peak-end coincides with a real photograph?
- What if this played once ever per browser (localStorage), not once per session?
- PRODUCT.md says the homepage concept isn't sacred — what if the fix isn't tuning this sequence, but cutting it from gating every first visit?
