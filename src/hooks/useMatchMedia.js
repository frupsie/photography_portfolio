/**
 * useMatchMedia — reactive media-query hook.
 *
 * A one-time `window.matchMedia(query).matches` check goes stale the moment
 * a viewport resizes without a full reload (rotating a device, resizing a
 * desktop window past a breakpoint) — this stays live via the query's own
 * `change` event instead of only reading it once on mount.
 *
 * Originally local to Home.jsx's Frames() (narrow/reduced-motion detection
 * for the pinned pan); promoted here once PhotoLightbox needed the same
 * "is this a small screen right now" check for its collapsible EXIF panel.
 */
import { useState, useEffect } from 'react';

export function useMatchMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
