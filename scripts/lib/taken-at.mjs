/**
 * resolveTakenAt — the one fallback chain for a photo's sortable capture
 * date, shared by import-photos.mjs (every future import) and
 * backfill-photo-dates.mjs (the one-time pass over photos already live).
 * Sharing it means the Gallery's "Latest" sort never has to reconcile two
 * different ideas of what a missing date should become.
 *
 * Preference order: real EXIF DateTimeOriginal, then photo-meta.js's
 * hand-curated display date (covers EXIF stripped on export), then the
 * city's own year pinned to Jan 1 as a last resort. Always returns a
 * valid ISO 8601 string — never null — so the sort itself never needs a
 * missing-value guard.
 */
export function resolveTakenAt({ exifDate, metaDate, cityYear }) {
  if (exifDate) {
    const d = new Date(exifDate);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (metaDate) {
    const d = new Date(metaDate);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const year = Number(cityYear);
  const fallbackYear = Number.isFinite(year) ? year : 1970;
  return new Date(Date.UTC(fallbackYear, 0, 1)).toISOString();
}
