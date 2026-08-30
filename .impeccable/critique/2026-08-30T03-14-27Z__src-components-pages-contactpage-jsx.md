---
target: contact page
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-30T03-14-27Z
slug: src-components-pages-contactpage-jsx
---
Method: dual-agent (A: a0ef9749ac29834a4 · B: a445d48be09ad085d)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Sending/disabled state clear; success state has no aria-live |
| 2 | Match System / Real World | 3 | Plain language throughout; commissions line is the one mismatch |
| 3 | User Control and Freedom | 3 | Error path preserves data + mailto escape; no draft persistence |
| 4 | Consistency and Standards | 2 | Submit button lacks the custom focus-visible already shipped on About's CTA |
| 5 | Error Prevention | 3 | required + type=email catch mistakes pre-network |
| 6 | Recognition Rather Than Recall | 4 | Persistent labels, nothing to hold in memory |
| 7 | Flexibility and Efficiency | 3 | autoComplete supported |
| 8 | Aesthetic and Minimalist Design | 4 | Restrained, on-brand |
| 9 | Error Recovery | 2 | Server-failure path excellent; native validation bubbles break the theme |
| 10 | Help and Documentation | 2 | No explicit help but reply-time line does real informal work |
| **Total** | | **29/40** | **Good (72.5%)** |

## Design Specificity Verdict

Frame is specific (split layout mirrors homepage device, real Nikko photo, Singapore copy); mechanism underneath (3 fields + submit) is boilerplate contact-form structure, an acceptable split for a form.

Deterministic scan: CLI clean. Browser DOM scan found 3 anti-patterns: hero-eyebrow-chip (false positive, .content-page__label has no chip styling, third occurrence this session), wide-tracking (real, .contact-form__field label), layout-transition "padding-left" (unconfirmed for the third time this session across two different pages — likely a detector bug, not a real site issue).

Correction to Assessment B: the input focus state isn't dead CSS — outline:none + border-color change is deliberate, not an oversight; the real issue is the border-color change is subtle.

## Overall Impression

Error-handling engineering is some of the best on the site — every failure mode funnels into one calm message with a real mailto fallback. But the success path (the moment that actually matters) gets none of the same care for anyone not watching the screen. The page also carries a trust gap PRODUCT.md already flagged: the commissions line stakes a claim the owner isn't currently backing.

## What's Working

- Unified error handling across HTTP/API/network failures into one message with a real fallback.
- Persistent labels over placeholder-as-label.
- Direct-email alternative is a real equal path, not a footnote.

## Priority Issues

**[P1] The commissions/editorial-licensing line claims a business that doesn't exist yet — already flagged in PRODUCT.md**
Most prominent line on the page, paired with a reply-time SLA, reads as an active business's terms. Needs owner sign-off on replacement copy, not proposed here.

**[P1] Success confirmation is invisible to anyone not watching the screen**
.contact-success has no aria-live/role="status" (contrast: the error state does get role="alert"); focus drops to body on send. Fix: role="status" aria-live="polite" plus move focus on mount.

**[P2] Native unstyled browser validation breaks the dark theme at the moment of user error**
Confirmed live: invalid email fires Chrome's default light validation bubble on a near-black page. Fix: noValidate + custom inline validation matching .contact-form__error.

**[P2] No draft persistence across route navigation**
Plain useState reset on unmount; a distracted visitor who navigates away mid-message loses everything. Fix: persist to localStorage, rehydrate on mount.

**[P3] Submit button has no custom focus-visible; input focus signal is subtle**
Same defect class already fixed on About's .ap-contact-btn this session. Fix: matching outline treatment on .contact-form__submit:focus-visible.

## Persona Red Flags

Sam: success-announcement gap and missing submit focus-visible both land here directly.
Riley: empty/malformed submits correctly blocked pre-network; the one thing that broke was navigate-away-and-back data loss.
Casey: same draft-loss issue hits hardest here; submit button tap target 188x43px, 1px under 44px guidance.

## Minor Observations

- prefers-reduced-motion not checked anywhere in this file, confirmed via grep — same gap already found and fixed on About page this session.
- No "send another message" link after success.
- Missing-key dev warning gives the owner no production signal beyond checking the Web3Forms dashboard.

## Questions to Consider

- What if the success state appended a banner above the retained, disabled form instead of replacing it outright?
- What if the direct email were promoted to the primary path and the form became secondary?
