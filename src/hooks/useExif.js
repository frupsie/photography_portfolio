/**
 * useExif — read real EXIF from a photo (when present), merged with a hand-curated
 * fallback in src/data/photo-meta.js. Cached in-memory across the app.
 *
 * Returns null until the first read resolves. Re-renders the component once
 * data lands. Exposes a normalized shape so display components don't care
 * whether the data came from the file or the fallback.
 *
 *   { camera, lens, shutter, aperture, iso, focal, location, date }
 */
import { useEffect, useState } from 'react';
import { photoMeta } from '../data/photo-meta';

const cache = new Map();

// Pretty-print helpers ────────────────────────────────────────────────────────
function fmtShutter(t) {
  if (t == null) return null;
  if (t >= 1) return `${t}s`;
  const denom = Math.round(1 / t);
  return `1/${denom}`;
}
function fmtAperture(f)   { return f == null ? null : `f/${f}`; }
function fmtFocal(mm)     { return mm == null ? null : `${Math.round(mm)}mm`; }
function fmtIso(n)        { return n == null ? null : `ISO ${n}`; }
function fmtCamera(make, model) {
  if (!model) return null;
  if (!make || model.startsWith(make)) return model;
  return `${make} ${model}`.replace(/\s+/g, ' ').trim();
}

function normalize(raw) {
  if (!raw) return null;
  // raw may be an exifr-shaped object OR a hand-curated fallback
  return {
    camera:   raw.camera   ?? fmtCamera(raw.Make, raw.Model),
    lens:     raw.lens     ?? raw.LensModel ?? null,
    shutter:  raw.shutter  ?? fmtShutter(raw.ExposureTime),
    aperture: raw.aperture ?? fmtAperture(raw.FNumber),
    iso:      raw.iso      ?? fmtIso(raw.ISO),
    focal:    raw.focal    ?? fmtFocal(raw.FocalLength),
    location: raw.location ?? null,
    date:     raw.date     ?? (raw.DateTimeOriginal
                                ? new Date(raw.DateTimeOriginal).toLocaleDateString(
                                    'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }
                                  )
                                : null),
  };
}

export function useExif(photoUrl) {
  const [data, setData] = useState(() => {
    if (!photoUrl) return null;
    if (cache.has(photoUrl)) return cache.get(photoUrl);
    return null;
  });

  useEffect(() => {
    if (!photoUrl) return;
    if (cache.has(photoUrl)) {
      setData(cache.get(photoUrl));
      return;
    }

    let cancelled = false;
    const fallback = photoMeta[photoUrl] ?? null;

    // Dynamic import keeps exifr out of the initial bundle.
    import('exifr')
      .then(({ default: exifr }) =>
        exifr.parse(photoUrl, [
          'Make', 'Model', 'LensModel',
          'ExposureTime', 'FNumber', 'ISO', 'FocalLength',
          'DateTimeOriginal',
          'GPSLatitude', 'GPSLongitude',
        ])
      )
      .then((real) => {
        if (cancelled) return;
        // Real EXIF fields override fallback; fallback fills the gaps.
        const merged = normalize({ ...real, ...fallback, ...stripEmpty(real ?? {}) });
        cache.set(photoUrl, merged);
        setData(merged);
      })
      .catch(() => {
        if (cancelled) return;
        const fb = normalize(fallback);
        cache.set(photoUrl, fb);
        setData(fb);
      });

    return () => { cancelled = true; };
  }, [photoUrl]);

  return data;
}

// Filter out null/undefined so real EXIF only overrides where it has a value.
function stripEmpty(obj) {
  const out = {};
  for (const k in obj) if (obj[k] != null) out[k] = obj[k];
  return out;
}
