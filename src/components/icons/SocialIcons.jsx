/**
 * Shared social-icon glyphs — Footer and AboutPage both render these, so a
 * fix or redraw only has to happen once. Plain primitives (rect/circle),
 * not a single hand-authored fill path: an earlier Instagram path collapsed
 * into a solid blob at small sizes because its winding direction swallowed
 * the lens and flash-dot holes instead of cutting them out.
 *
 * Stroke convention matches the rest of the site's hand-rolled icons
 * (Navbar, AboutPage's arrow): viewBox 24, strokeWidth 1.5, round caps/joins.
 */
export function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" {...props}>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="17.15" cy="6.85" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EmailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.6 6.5 12 13l8.4-6.5" />
    </svg>
  );
}
