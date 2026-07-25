/**
 * generate-thumbs.mjs
 *
 * Generates the grid thumbnail tier: /public/photos-thumb/<slug>/<name>.webp
 *
 * Why: the gallery and city grids were serving the same 1600px JPEGs the
 * lightbox uses — up to 1.1 MB each — into cells only a few hundred pixels
 * wide. This produces an 800px WebP per photo (~10x smaller) for grid use,
 * while the lightbox keeps loading the full photos-web version.
 *
 * Source is /public/photos-web/ (not the full-res archive) because
 * public/photos/ is gitignored — photos-web is the tier guaranteed to exist
 * in any clone. 1600px downscaled to 800px is ample.
 *
 * Idempotent: skips any thumbnail that already exists and is newer than its
 * source, so re-running is cheap.
 *
 * Usage:
 *   npm run generate-thumbs            generate missing thumbnails
 *   npm run generate-thumbs -- --force rebuild every thumbnail
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.resolve(__dirname, '..');
const WEB_DIR    = path.join(ROOT, 'public', 'photos-web');
const THUMB_DIR  = path.join(ROOT, 'public', 'photos-thumb');

export const THUMB_WIDTH   = 800;  // long-edge px — covers grid cells at 1x and portrait cells at 2x
export const THUMB_QUALITY = 76;   // WebP quality

const c = {
  dim:   (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow:(s) => `\x1b[33m${s}\x1b[0m`,
  cyan:  (s) => `\x1b[36m${s}\x1b[0m`,
  bold:  (s) => `\x1b[1m${s}\x1b[0m`,
};

/** '/a/b/IMG_1.JPG' → '/a/b/IMG_1.webp' */
export const toWebpName = (filename) => filename.replace(/\.(jpe?g|png)$/i, '.webp');

/**
 * Generate one thumbnail. Shared with import-photos.mjs so new imports and
 * backfills produce byte-identical output.
 */
export async function makeThumb(srcPath, destPath) {
  await mkdir(path.dirname(destPath), { recursive: true });
  await sharp(srcPath)
    .rotate()                                                  // honor EXIF orientation
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toFile(destPath);
}

// ─── Backfill runner ────────────────────────────────────────────────────────

async function main() {
  const FORCE = process.argv.includes('--force');
  console.log(c.bold(`\nGenerating thumbnails${FORCE ? c.yellow(' (force rebuild)') : ''}\n`));

  if (!existsSync(WEB_DIR)) {
    console.log(c.yellow('No public/photos-web/ directory found. Nothing to do.'));
    return;
  }

  const slugs = (await readdir(WEB_DIR, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  let made = 0, skipped = 0, srcBytes = 0, outBytes = 0;

  for (const slug of slugs) {
    const srcDir = path.join(WEB_DIR, slug);
    const files  = (await readdir(srcDir)).filter((f) => /\.(jpe?g|png)$/i.test(f));
    if (!files.length) continue;

    let slugMade = 0;
    for (const file of files) {
      const srcPath  = path.join(srcDir, file);
      const destPath = path.join(THUMB_DIR, slug, toWebpName(file));

      // Skip when an up-to-date thumbnail already exists
      if (!FORCE && existsSync(destPath)) {
        const [s, d] = await Promise.all([stat(srcPath), stat(destPath)]);
        if (d.mtimeMs >= s.mtimeMs) { skipped++; continue; }
      }

      await makeThumb(srcPath, destPath);
      const [s, d] = await Promise.all([stat(srcPath), stat(destPath)]);
      srcBytes += s.size;
      outBytes += d.size;
      made++; slugMade++;
    }
    if (slugMade) console.log(`  ${c.green('ok')}  ${slug}  ${c.dim(`+${slugMade}`)}`);
  }

  console.log(c.bold('\nSummary'));
  console.log(`  generated: ${made}${skipped ? c.dim(`   skipped (up to date): ${skipped}`) : ''}`);
  if (made) {
    const mb = (b) => (b / 1_048_576).toFixed(1);
    const ratio = (srcBytes / outBytes).toFixed(1);
    console.log(`  size:      ${mb(srcBytes)} MB → ${c.cyan(`${mb(outBytes)} MB`)}  ${c.dim(`(${ratio}x smaller)`)}`);
  }
  console.log(c.dim(`\nWritten to: ${path.relative(ROOT, THUMB_DIR)}/<slug>/\n`));
}

// Only run when invoked directly, not when imported by import-photos.mjs
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
}
