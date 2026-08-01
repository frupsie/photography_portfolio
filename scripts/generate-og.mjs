/**
 * generate-og.mjs
 *
 * Builds public/og-image.jpg — the image social platforms show when the site
 * is shared.
 *
 * Why a dedicated file rather than pointing og:image at a photo: platforms
 * expect 1200x630 (1.91:1). Handed a 3:2 photo they crop it themselves, and
 * each one crops differently — usually through the middle of the subject.
 * Producing the exact ratio once means the preview looks deliberate everywhere.
 *
 * Source is whichever photo you point SOURCE at; it reads from photos-web so
 * it works in a fresh clone (public/photos/ is gitignored).
 *
 * Usage:
 *   npm run generate-og
 */
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCE = path.join(ROOT, 'public', 'photos-web', 'hong-kong', '_MG_3601.JPG');
const OUT    = path.join(ROOT, 'public', 'og-image.jpg');

const WIDTH   = 1200;
const HEIGHT  = 630;
const QUALITY = 86;

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Source photo not found:\n  ${path.relative(ROOT, SOURCE)}`);
    console.error('Edit SOURCE in this script to point at a photo that exists.');
    process.exit(1);
  }

  await sharp(SOURCE)
    .rotate()
    .resize({ width: WIDTH, height: HEIGHT, fit: 'cover', position: 'attention' })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(OUT);

  const { size } = await stat(OUT);
  const meta = await sharp(OUT).metadata();
  console.log(`\nog-image.jpg  ${meta.width}x${meta.height}  ${(size / 1024).toFixed(0)} KB`);
  console.log(`from  ${path.relative(ROOT, SOURCE)}\n`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
