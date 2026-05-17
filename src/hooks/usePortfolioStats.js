/**
 * usePortfolioStats — derives real numbers from static data sources.
 *
 * Sources:
 *   cities.js    → city count, country count, published photo count
 *   photo-meta.js → most-used focal length, favourite aperture, camera body count
 *
 * Everything is computed once at module load (no async / no fetching).
 * Real EXIF wins where present; photo-meta fills the rest.
 */
import { cities } from '../data/cities';
import { photoMeta } from '../data/photo-meta';

/** Returns the most-frequently-occurring value in an array. */
function mostCommon(arr) {
  if (!arr.length) return '—';
  const freq = {};
  arr.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

/** Stable singleton so callers share the same object reference. */
let _cache = null;

export function usePortfolioStats() {
  if (_cache) return _cache;

  // ── Travel numbers ───────────────────────────────────────────────────────
  const cityCount    = cities.length;
  const countryCount = new Set(cities.map((c) => c.country)).size;
  // Count unique published photos — same dedup logic as GalleryPage.buildPhotoList():
  // hero images that aren't already in photos[] are counted separately.
  const seen = new Set();
  cities.forEach((city) => {
    if (city.heroImage && !city.heroImage.includes('placeholder')) seen.add(city.heroImage);
    city.photos.forEach((p) => seen.add(typeof p === 'string' ? p : p.src));
  });
  const photoCount = seen.size;

  // ── Photographer / EXIF numbers ──────────────────────────────────────────
  const metaValues  = Object.values(photoMeta);
  const focals      = metaValues.map((m) => m.focal).filter(Boolean);
  const apertures   = metaValues.map((m) => m.aperture).filter(Boolean);
  const cameraNames = metaValues.map((m) => m.camera).filter(Boolean);

  const favFocal    = mostCommon(focals);
  const favAperture = mostCommon(apertures);
  const cameraCount = new Set(cameraNames).size;

  _cache = {
    cities:       cityCount,
    countries:    countryCount,
    photos:       photoCount,
    favFocal,
    favAperture,
    cameras:      cameraCount,
  };

  return _cache;
}
