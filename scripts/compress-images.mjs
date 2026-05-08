/**
 * Compresses all hero images in public/photos to web-optimised JPEGs.
 * Output: public/photos/<city>/hero-web.jpg  (max 1920px wide, ~200-300 KB)
 * Run:  node scripts/compress-images.mjs
 */
import sharp from 'sharp';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';

const PHOTOS_DIR = new URL('../public/photos', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const EXTS = new Set(['.jpg', '.jpeg', '.JPG', '.JPEG', '.png', '.PNG']);

async function compress(src, dest) {
  const before = statSync(src).size;
  await sharp(src)
    .resize({ width: 1920, height: 1280, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(dest);
  const after = statSync(dest).size;
  const pct = Math.round((1 - after / before) * 100);
  console.log(`  ✓  ${basename(src)}  ${(before/1e6).toFixed(1)} MB → ${(after/1e6).toFixed(2)} MB  (−${pct}%)`);
}

const cities = readdirSync(PHOTOS_DIR).filter(d =>
  statSync(join(PHOTOS_DIR, d)).isDirectory() && d !== 'placeholder'
);

for (const city of cities) {
  const dir = join(PHOTOS_DIR, city);
  const files = readdirSync(dir).filter(f => EXTS.has(extname(f)));
  for (const file of files) {
    const src = join(dir, file);
    const dest = join(dir, 'hero-web.jpg');
    if (file === 'hero-web.jpg') continue; // skip already-compressed outputs
    process.stdout.write(`Compressing ${city}/${file} … `);
    process.stdout.write('\n');
    await compress(src, dest);
  }
}

console.log('\nDone! Update cities.js heroImage paths to use hero-web.jpg');
