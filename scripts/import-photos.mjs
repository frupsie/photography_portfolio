/**
 * import-photos.mjs
 *
 * Imports new photos from .exif-inbox/ into the portfolio in one shot.
 *
 * Layout convention:
 *   .exif-inbox/
 *     <city-slug>/           ← subfolder name MUST match a slug in cities.js
 *       photo1.jpg
 *       photo2.jpg
 *
 * What it does per photo:
 *   1. Validates the parent folder is a known city slug
 *   2. Skips if a file with the same name already exists for that city
 *      (idempotent — safe to re-run)
 *   3. Reads real EXIF (camera, lens, shutter, aperture, ISO, focal, date, GPS)
 *   4. GPS sanity check: if EXIF has GPS, warns when the shot is >200 km from
 *      the city centre listed in cities.js (catches misfiled photos)
 *   5. Detects orientation via image dimensions (sharp)
 *   6. Copies the JPG → /public/photos/<slug>/<filename>
 *   7. Appends a { src, alt, orientation } entry to that city's photos[] in cities.js
 *   8. Inserts a /photos/<slug>/<filename> → EXIF entry into photo-meta.js
 *   9. If the city has no heroImage yet, promotes the first imported photo
 *  10. Moves processed files to .exif-inbox/.processed/<timestamp>/ as a safety net
 *
 * Usage:
 *   npm run import-photos              normal run
 *   npm run import-photos -- --dry     preview without writing anything
 */
import {
  readdir, readFile, writeFile, mkdir, copyFile, rename, stat,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import exifr from 'exifr';
import sharp from 'sharp';
import { makeThumb, toWebpName } from './generate-thumbs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const INBOX     = path.join(ROOT, '.exif-inbox');
const PROCESSED = path.join(INBOX, '.processed');
const PHOTOS_DIR       = path.join(ROOT, 'public', 'photos');        // full-res archive
const PHOTOS_WEB_DIR   = path.join(ROOT, 'public', 'photos-web');    // 1600px JPEG (lightbox/hero)
const PHOTOS_THUMB_DIR = path.join(ROOT, 'public', 'photos-thumb');  // 800px WebP (grids)
const CITIES_FILE = path.join(ROOT, 'src', 'data', 'cities.js');
const META_FILE   = path.join(ROOT, 'src', 'data', 'photo-meta.js');

const DRY = process.argv.includes('--dry') || process.argv.includes('--dry-run');
const GPS_WARN_KM = 200;       // warn if photo's GPS is further than this from the city centre
const MIN_ORIGINAL_BYTES = 1_000_000; // reject "originals" under 1 MB as likely already-compressed
const WEB_MAX_WIDTH = 1600;    // web variant max long-edge in pixels
const WEB_QUALITY   = 82;      // JPEG quality for web variant

// ─── Console helpers ────────────────────────────────────────────────────────
const c = {
  dim:   (s) => `\x1b[2m${s}\x1b[0m`,
  red:   (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow:(s) => `\x1b[33m${s}\x1b[0m`,
  cyan:  (s) => `\x1b[36m${s}\x1b[0m`,
  bold:  (s) => `\x1b[1m${s}\x1b[0m`,
};

// ─── Geo / format helpers ───────────────────────────────────────────────────
function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

const fmtShutter  = (t) => t == null ? null : (t >= 1 ? `${t}s` : `1/${Math.round(1/t)}`);
const fmtAperture = (f) => f == null ? null : `f/${f}`;
const fmtFocal    = (m) => m == null ? null : `${Math.round(m)}mm`;
const fmtIso      = (n) => n == null ? null : `ISO ${n}`;
const fmtDate     = (d) => !d ? null
  : new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function fmtCamera(make, model) {
  if (!model) return null;
  if (!make || model.startsWith(make)) return model;
  return `${make} ${model}`.replace(/\s+/g, ' ').trim();
}

/** Normalise raw lens strings from EXIF into the gear-list style. Best-effort. */
function fmtLens(raw) {
  if (!raw) return null;
  // Examples we've seen in real EXIF:
  //   "24-105mm F4 DG OS HSM | Art 013"       → Sigma 24–105mm f/4 DG OS HSM Art
  //   "RF50mm F1.8 STM"                       → Canon RF 50mm f/1.8 STM
  //   "XF23mmF2 R WR"                         → Fujifilm XF 23mm f/2 R WR
  let s = raw.trim();
  if (/sigma|art \d{3}/i.test(s) || /DG OS HSM/.test(s)) {
    s = s.replace(/^(?!Sigma)/i, 'Sigma ').replace(/\|?\s*Art\s*\d*/i, 'Art').replace(/-/g, '–');
  } else if (/^RF\d/i.test(s)) {
    s = s.replace(/^RF/i, 'Canon RF ').replace(/(\d+)mm/, '$1mm');
  } else if (/^XF\d/i.test(s)) {
    s = s.replace(/^XF/i, 'Fujifilm XF ');
  }
  return s.replace(/F([\d.]+)/g, 'f/$1').replace(/\s+/g, ' ').trim();
}

// ─── Read cities.js (as data, via dynamic import) ───────────────────────────
async function loadCities() {
  // Import using a query-string buster so re-runs see the latest file
  const mod = await import(`file://${CITIES_FILE.replace(/\\/g, '/')}?t=${Date.now()}`);
  return mod.cities;
}

// ─── Inbox scan ─────────────────────────────────────────────────────────────
async function scanInbox() {
  if (!existsSync(INBOX)) return [];
  const entries = await readdir(INBOX, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith('.')) continue;  // skip .processed etc.
    const slug = e.name;
    const dir = path.join(INBOX, slug);
    const files = (await readdir(dir)).filter((f) => /\.(jpe?g)$/i.test(f));
    for (const file of files) {
      out.push({ slug, filename: file, srcPath: path.join(dir, file) });
    }
  }
  return out;
}

// ─── Per-photo processing ───────────────────────────────────────────────────
async function processPhoto(item, cityMap) {
  const { slug, filename, srcPath } = item;
  const city = cityMap.get(slug);
  if (!city) {
    return { ok: false, reason: `Unknown city slug "${slug}". Known: ${[...cityMap.keys()].join(', ')}` };
  }

  // Reject "originals" that are already too small — almost certainly someone
  // dropped a web export by mistake. Strict mirroring requires real originals.
  const stats = await stat(srcPath);
  if (stats.size < MIN_ORIGINAL_BYTES) {
    return { ok: false, reason: `file is only ${(stats.size / 1024).toFixed(0)} KB — looks pre-compressed. Drop the full-res original.` };
  }

  // Duplicate detection with three branches:
  //   archive exists                 → already imported, skip.
  //   archive missing + web exists   → backfill: archive the original,
  //                                    re-generate the web variant from it,
  //                                    refresh photo-meta.js (don't touch photos[]
  //                                    — entry's already there). Used to retro-fix
  //                                    the orphan web photos that have no archived
  //                                    originals.
  //   neither exists                 → fresh import.
  const archiveDir  = path.join(PHOTOS_DIR, slug);
  const archivePath = path.join(archiveDir, filename);
  const webDir      = path.join(PHOTOS_WEB_DIR, slug);
  const webPath     = path.join(webDir, filename);
  const thumbPath   = path.join(PHOTOS_THUMB_DIR, slug, toWebpName(filename));
  if (existsSync(archivePath)) {
    return { ok: false, skipped: true, reason: 'duplicate — original already archived' };
  }
  const isBackfill = existsSync(webPath);

  // EXIF
  const buf  = await readFile(srcPath);
  const exif = (await exifr.parse(buf, [
    'Make', 'Model', 'LensModel',
    'ExposureTime', 'FNumber', 'ISO', 'FocalLength',
    'DateTimeOriginal',
    'GPSLatitude', 'GPSLongitude',
  ])) ?? {};

  // GPS sanity check
  const gpsWarning = (() => {
    if (exif.GPSLatitude == null || exif.GPSLongitude == null) return null;
    const km = haversineKm(
      { lat: exif.GPSLatitude, lon: exif.GPSLongitude },
      { lat: city.lat,         lon: city.lon }
    );
    if (km > GPS_WARN_KM) {
      return `GPS says this shot is ${Math.round(km)} km from ${city.name} — wrong folder?`;
    }
    return null;
  })();

  // Orientation via sharp (reliable, ignores broken EXIF dimensions)
  const meta = await sharp(buf).metadata();
  const orientation = (meta.width ?? 0) >= (meta.height ?? 0) ? 'landscape' : 'portrait';

  // All data-file references point to the web-served path. /photos/ is archive only.
  const publicPath = `/photos-web/${slug}/${filename}`;
  const photoEntry = {
    src: publicPath,
    alt: `${city.name}, ${city.country}`,
    orientation,
  };
  const metaEntry = {
    camera:   fmtCamera(exif.Make, exif.Model),
    lens:     fmtLens(exif.LensModel),
    shutter:  fmtShutter(exif.ExposureTime),
    aperture: fmtAperture(exif.FNumber),
    iso:      fmtIso(exif.ISO),
    focal:    fmtFocal(exif.FocalLength),
    location: `${city.name}, ${city.country}`,
    date:     fmtDate(exif.DateTimeOriginal),
  };

  return {
    ok: true,
    slug, filename, srcPath, archiveDir, archivePath, webDir, webPath, thumbPath, publicPath,
    photoEntry, metaEntry, gpsWarning, isBackfill,
    // Hero promotion only happens on fresh imports for cities without a real hero
    promoteToHero: !isBackfill && (!city.heroImage || /placeholder|hero-web\.jpg/i.test(city.heroImage)),
  };
}

// ─── File writers ───────────────────────────────────────────────────────────

/** Append new photos[] entries to a city's array, preserving the rest of cities.js. */
async function rewriteCities(results) {
  let src = await readFile(CITIES_FILE, 'utf8');

  // Group new entries by slug — backfills already have a photos[] entry,
  // so they're excluded from this rewrite. Hero promotion is also excluded
  // for backfills (handled at processPhoto level).
  const bySlug = new Map();
  for (const r of results) {
    if (r.isBackfill) continue;
    if (!bySlug.has(r.slug)) bySlug.set(r.slug, []);
    bySlug.get(r.slug).push(r);
  }
  if (bySlug.size === 0) return; // nothing to rewrite in cities.js

  for (const [slug, entries] of bySlug) {
    // Find this city's object block: `slug: '<slug>'` ... up to its closing `},`
    const cityBlockRe = new RegExp(
      `(slug:\\s*['"\`]${slug}['"\`][\\s\\S]*?photos:\\s*\\[)([\\s\\S]*?)(\\][\\s\\S]*?\\},)`,
      'm'
    );
    if (!cityBlockRe.test(src)) {
      console.warn(c.yellow(`  ! Could not locate "${slug}" in cities.js — skipping its photos array update.`));
      continue;
    }

    const lines = entries.map((r) => {
      const o = r.photoEntry;
      // Match the existing single-line style used elsewhere in cities.js
      return `      { src: '${o.src}', alt: '${o.alt.replace(/'/g, "\\'")}', orientation: '${o.orientation}' },`;
    }).join('\n');

    src = src.replace(cityBlockRe, (m, head, body, tail) => {
      const trimmedBody = body.replace(/\s+$/, '');
      const needsNewline = trimmedBody.length > 0 && !trimmedBody.endsWith('\n');
      const inner = trimmedBody.length === 0
        ? `\n${lines}\n    `
        : `${trimmedBody}${needsNewline ? '\n' : ''}${lines}\n    `;
      return `${head}${inner}${tail}`;
    });

    // Hero promotion: if the city's heroImage is empty/placeholder, set it to first new photo
    const promoter = entries.find((r) => r.promoteToHero);
    if (promoter) {
      const heroRe = new RegExp(
        `(slug:\\s*['"\`]${slug}['"\`][\\s\\S]*?heroImage:\\s*)['"\`][^'"\`]*['"\`]`,
        'm'
      );
      if (heroRe.test(src)) {
        src = src.replace(heroRe, `$1'${promoter.publicPath}'`);
        promoter._didPromote = true;
      }
    }
  }

  if (!DRY) await writeFile(CITIES_FILE, src, 'utf8');
}

/** Insert new keys into photo-meta.js, preserving the top header comment block. */
async function rewriteMeta(results) {
  const src = await readFile(META_FILE, 'utf8');

  // Pull the existing object via dynamic import
  const mod = await import(`file://${META_FILE.replace(/\\/g, '/')}?t=${Date.now()}`);
  const existing = mod.photoMeta;

  // Merge — new entries override existing if same key (shouldn't happen, but safe)
  const merged = { ...existing };
  for (const r of results) {
    merged[r.publicPath] = stripNulls(r.metaEntry);
  }

  // Stable insertion order: existing first, new appended
  const orderedKeys = [...Object.keys(existing), ...results.map((r) => r.publicPath).filter((k) => !(k in existing))];

  // Preserve the original header (everything before `export const photoMeta`)
  const headerMatch = src.match(/^([\s\S]*?)export const photoMeta\s*=\s*\{/);
  const header = headerMatch ? headerMatch[1] : '';

  // Re-emit the object with consistent 2-space indentation, matching existing style
  const body = orderedKeys.map((key) => {
    const obj = merged[key];
    const lines = Object.entries(obj)
      .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
      .join('\n');
    return `  '${key}': {\n${lines}\n  },`;
  }).join('\n');

  const out = `${header}export const photoMeta = {\n${body}\n};\n`;
  if (!DRY) await writeFile(META_FILE, out, 'utf8');
}

function stripNulls(obj) {
  const o = {};
  for (const k in obj) if (obj[k] != null) o[k] = obj[k];
  return o;
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(c.bold(`\nPhoto import${DRY ? c.yellow(' (DRY RUN)') : ''}\n`));

  const items = await scanInbox();
  if (!items.length) {
    console.log(c.dim('Inbox empty. Drop JPGs into .exif-inbox/<city-slug>/ and re-run.'));
    return;
  }

  const cities = await loadCities();
  const cityMap = new Map(cities.map((c) => [c.slug, c]));

  // Process each photo
  const results = [];
  for (const item of items) {
    const r = await processPhoto(item, cityMap);
    if (!r.ok) {
      const label = r.skipped ? c.yellow('skip') : c.red('fail');
      console.log(`  ${label}  ${item.slug}/${item.filename}  ${c.dim(r.reason)}`);
      continue;
    }
    if (r.gpsWarning) {
      console.log(`  ${c.yellow('warn')}  ${r.slug}/${r.filename}  ${c.yellow(r.gpsWarning)}`);
    }
    const tag = r.isBackfill ? c.cyan('back') : c.green('ok  ');
    const note = r.isBackfill ? ' [backfill]' : '';
    console.log(`  ${tag}  ${r.slug}/${r.filename}${c.dim(note)}  ${c.dim(`${r.photoEntry.orientation} · ${r.metaEntry.camera ?? '—'} · ${r.metaEntry.focal ?? '—'} · ${r.metaEntry.aperture ?? '—'}`)}`);
    results.push(r);
  }

  if (!results.length) {
    console.log(c.dim('\nNothing to import.'));
    return;
  }

  // Copy originals into /public/photos/<slug>/ AND (re)generate both served
  // variants: photos-web (1600px JPEG, lightbox/hero) and photos-thumb
  // (800px WebP, grids). Strict mirror: all three must exist.
  // Backfills regenerate from the freshly-supplied original
  // — guaranteed-from-original beats whatever was there before.
  for (const r of results) {
    if (DRY) continue;
    await mkdir(r.archiveDir, { recursive: true });
    await mkdir(r.webDir,     { recursive: true });
    await copyFile(r.srcPath, r.archivePath);
    // Web variant: resize long-edge to WEB_MAX_WIDTH, re-encode JPEG at WEB_QUALITY.
    // Keep EXIF metadata so useExif can read real values at runtime.
    await sharp(r.srcPath)
      .rotate() // honor EXIF orientation, then bake it in
      .resize({ width: WEB_MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: WEB_QUALITY, mozjpeg: true })
      .withMetadata()
      .toFile(r.webPath);
    // Grid thumbnail (800px WebP). Generated from the web variant so it stays
    // byte-identical to what `npm run generate-thumbs` would produce.
    await makeThumb(r.webPath, r.thumbPath);
  }

  // Update data files
  await rewriteMeta(results);
  await rewriteCities(results);

  // Move processed inbox files into .processed/<timestamp>/
  if (!DRY) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveBase = path.join(PROCESSED, ts);
    for (const r of results) {
      const archDir = path.join(archiveBase, r.slug);
      await mkdir(archDir, { recursive: true });
      await rename(r.srcPath, path.join(archDir, r.filename));
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────
  const bySlug = results.reduce((m, r) => {
    (m[r.slug] ??= []).push(r);
    return m;
  }, {});

  console.log(c.bold('\nSummary'));
  for (const [slug, rs] of Object.entries(bySlug)) {
    const promo = rs.find((r) => r._didPromote);
    const hero  = promo ? c.cyan(`  (set hero → ${promo.filename})`) : '';
    console.log(`  · ${slug}: +${rs.length}  [${rs.map((r) => r.filename).join(', ')}]${hero}`);
  }
  console.log(c.dim(`\nUpdated: ${path.relative(ROOT, META_FILE)}, ${path.relative(ROOT, CITIES_FILE)}`));
  console.log(c.dim(`Archived inbox files to: ${path.relative(ROOT, PROCESSED)}/<timestamp>/`));
  if (DRY) console.log(c.yellow('\n(Dry run — no files were changed.)'));
}

main().catch((e) => { console.error(c.red(e.stack || e.message)); process.exit(1); });
