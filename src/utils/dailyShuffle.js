/**
 * dailyShuffle.js — deterministic daily photo selection.
 *
 * Same 10 photos all day for every visitor; different 10 tomorrow.
 * Pure functions — no side-effects, SSR-safe.
 */

/** Integer day number in the viewer's local timezone (days since epoch). */
export function dayNumber(now = new Date()) {
  const ms = now.getTime() - now.getTimezoneOffset() * 60_000;
  return Math.floor(ms / 86_400_000);
}

/**
 * Mulberry32 — tiny, fast, seeded PRNG.
 * Returns a function; each call advances the state and yields [0, 1).
 */
function seededRng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates in-place shuffle using a seeded RNG. Returns a NEW array. */
export function seededShuffle(arr, seed) {
  const out = arr.slice();
  const rng = seededRng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pick `n` items from `arr` using today's date as the seed.
 * Pass a custom `now` for testing (e.g., tomorrow = new Date(Date.now() + 86400000)).
 */
export function pickDaily(arr, n, now = new Date()) {
  return seededShuffle(arr, dayNumber(now)).slice(0, n);
}
