/**
 * extract-exif.mjs
 *
 * Reads every JPG in .exif-inbox/, pulls real EXIF via exifr, and prints
 * a `photo-meta.js`-shaped block you can paste in. Maps inbox filename →
 * target photo path via the FILE_MAP below.
 *
 * Usage:  node scripts/extract-exif.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import exifr from 'exifr';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INBOX = path.resolve(__dirname, '../.exif-inbox');

// inbox filename (case-insensitive, sans extension) → target photo path used in photo-meta.js
const FILE_MAP = {
  '_mg_3601': '/photos/hong-kong/_MG_3601.JPG',
  'img_1474': '/photos/nikko/hero-web.jpg',
  // generic aliases also accepted
  'hong-kong': '/photos/hong-kong/_MG_3601.JPG',
  'nikko':     '/photos/nikko/hero-web.jpg',
};

// Hand-coded fallbacks for location strings (EXIF often lacks place names).
const LOCATION_HINTS = {
  '/photos/hong-kong/_MG_3601.JPG': 'Victoria Peak, Hong Kong',
  '/photos/nikko/hero-web.jpg':     'Nikko, Japan',
};

// Pretty-print helpers — match the existing photo-meta.js style.
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

async function main() {
  const files = (await readdir(INBOX)).filter((f) => /\.(jpe?g)$/i.test(f));
  if (!files.length) {
    console.error('No JPGs found in .exif-inbox/. Drop your files there and re-run.');
    process.exit(1);
  }

  const blocks = [];
  for (const file of files) {
    const stem = path.basename(file, path.extname(file)).toLowerCase();
    const target = FILE_MAP[stem];
    if (!target) {
      console.warn(`Skipping ${file} — no FILE_MAP entry for "${stem}".`);
      continue;
    }

    const buf  = await readFile(path.join(INBOX, file));
    const exif = await exifr.parse(buf, [
      'Make', 'Model', 'LensModel',
      'ExposureTime', 'FNumber', 'ISO', 'FocalLength',
      'DateTimeOriginal',
    ]) ?? {};

    const meta = {
      camera:   fmtCamera(exif.Make, exif.Model),
      lens:     exif.LensModel ?? null,
      shutter:  fmtShutter(exif.ExposureTime),
      aperture: fmtAperture(exif.FNumber),
      iso:      fmtIso(exif.ISO),
      focal:    fmtFocal(exif.FocalLength),
      location: LOCATION_HINTS[target] ?? null,
      date:     fmtDate(exif.DateTimeOriginal),
    };

    console.log(`\n── ${file} → ${target} ─────────────────────────`);
    console.log(meta);

    const lines = Object.entries(meta)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
      .join('\n');
    blocks.push(`  '${target}': {\n${lines}\n  },`);
  }

  console.log('\n\n══════════ Paste into src/data/photo-meta.js ══════════\n');
  console.log(blocks.join('\n'));
  console.log('\n═══════════════════════════════════════════════════════\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
