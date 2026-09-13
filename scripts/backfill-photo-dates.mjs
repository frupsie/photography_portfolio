/**
 * backfill-photo-dates.mjs
 *
 * One-time (but safely re-runnable) pass that gives every photo already
 * live in cities.js a sortable `takenAt` date — the field the Gallery's
 * "Latest" sort reads. Future imports get this automatically from
 * import-photos.mjs; this script exists purely to catch up the photos
 * that were imported before that field existed.
 *
 * For each photo already in cities.js:
 *   1. Skip if it already has `takenAt` (idempotent — safe to re-run).
 *   2. Read real EXIF DateTimeOriginal from the served file
 *      (public/photos-web/<slug>/<filename> — still carries EXIF; see
 *      import-photos.mjs's `.withMetadata()`).
 *   3. Fall back to photo-meta.js's hand-curated display date, then the
 *      city's own year — see lib/taken-at.mjs for the exact chain, shared
 *      with import-photos.mjs so both paths agree on a missing date.
 *   4. Write `takenAt` into that exact photo's entry in cities.js,
 *      in place, preserving everything else about the file untouched.
 *
 * Usage:
 *   node scripts/backfill-photo-dates.mjs           normal run
 *   node scripts/backfill-photo-dates.mjs --dry      preview only
 *   node scripts/backfill-photo-dates.mjs --force    recompute even where takenAt already exists
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import exifr from 'exifr';
import { resolveTakenAt } from './lib/taken-at.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CITIES_FILE = path.join(ROOT, 'src', 'data', 'cities.js');
const META_FILE = path.join(ROOT, 'src', 'data', 'photo-meta.js');
const PUBLIC_DIR = path.join(ROOT, 'public');

const DRY = process.argv.includes('--dry') || process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loadModule(file) {
  const mod = await import(`file://${file.replace(/\\/g, '/')}?t=${Date.now()}`);
  return mod;
}

async function main() {
  console.log(c.bold(`\nBackfill photo dates${DRY ? c.yellow(' (DRY RUN)') : ''}\n`));

  const { cities } = await loadModule(CITIES_FILE);
  const { photoMeta } = await loadModule(META_FILE);

  let src = await readFile(CITIES_FILE, 'utf8');

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const city of cities) {
    for (const photo of city.photos ?? []) {
      // Every photo in cities.js is already an object by this point in the
      // project's history (see cities.js) — string-shorthand entries
      // predate this field and aren't expected here.
      if (typeof photo !== 'object' || !photo.src) continue;
      if (photo.takenAt && !FORCE) { skipped++; continue; }

      const filePath = path.join(PUBLIC_DIR, photo.src);
      let exifDate = null;
      if (existsSync(filePath)) {
        try {
          const exif = await exifr.parse(filePath, ['DateTimeOriginal']);
          exifDate = exif?.DateTimeOriginal ?? null;
        } catch {
          // Corrupt or unreadable EXIF block — fall through to the
          // photo-meta.js / city-year fallback below, same as a photo
          // with no EXIF date at all.
        }
      } else {
        console.log(`  ${c.yellow('miss')}  ${photo.src}  ${c.dim('file not found on disk — using fallback chain only')}`);
        missing++;
      }

      const takenAt = resolveTakenAt({
        exifDate,
        metaDate: photoMeta[photo.src]?.date ?? null,
        cityYear: city.year,
      });

      const lineRe = new RegExp(`(\\{ src: '${escapeRe(photo.src)}'[^\\n}]*)\\}`, 'm');
      if (!lineRe.test(src)) {
        console.log(`  ${c.red('fail')}  ${photo.src}  ${c.dim('could not locate this exact entry in cities.js')}`);
        continue;
      }
      src = src.replace(lineRe, (_m, head) => `${head.replace(/\s+$/, '')}, takenAt: '${takenAt}' }`);
      const source = exifDate ? 'exif' : (photoMeta[photo.src]?.date ? 'meta' : 'year');
      console.log(`  ${c.green('ok  ')}  ${photo.src}  ${c.dim(`${takenAt}  (${source})`)}`);
      updated++;
    }
  }

  if (!DRY && updated > 0) await writeFile(CITIES_FILE, src, 'utf8');

  console.log(c.bold('\nSummary'));
  console.log(`  updated: ${updated}   already-had-date: ${skipped}   file-not-found: ${missing}`);
  if (DRY) console.log(c.yellow('\n(Dry run — cities.js was not changed.)'));
}

main().catch((e) => { console.error(c.red(e.stack || e.message)); process.exit(1); });
