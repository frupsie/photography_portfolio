/**
 * compress-photos.js
 * Compresses all full-res JPEGs in public/photos/ (except already-optimised hero-web.jpg)
 * into a public/photos-web/ mirror tree, preserving the same folder structure.
 *
 * Output: max 1920px wide, JPEG quality 82, progressive encoding.
 * Run: node scripts/compress-photos.js
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT  = path.join(__dirname, '..', 'public', 'photos');
const OUT_ROOT  = path.join(__dirname, '..', 'public', 'photos-web');

const MAX_WIDTH  = 1920;
const QUALITY    = 82;

// Files already optimised — skip them
const SKIP = new Set(['hero-web.jpg']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(full));
    else if (/\.(jpe?g|png|webp)$/i.test(e.name) && !SKIP.has(e.name)) files.push(full);
  }
  return files;
}

async function compress(src) {
  const rel     = path.relative(SRC_ROOT, src);
  const outPath = path.join(OUT_ROOT, rel).replace(/\.(png|webp)$/i, '.jpg');
  const outDir  = path.dirname(outPath);

  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

  const meta = await sharp(src).metadata();
  const needsResize = meta.width > MAX_WIDTH;

  let pipeline = sharp(src);
  if (needsResize) pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  pipeline = pipeline.jpeg({ quality: QUALITY, progressive: true, mozjpeg: true });

  await pipeline.toFile(outPath);

  const srcKB = Math.round((await import('fs')).statSync(src).size / 1024);
  const outKB = Math.round((await import('fs')).statSync(outPath).size / 1024);
  console.log(`  ${rel.padEnd(35)} ${String(srcKB).padStart(6)} KB  →  ${String(outKB).padStart(5)} KB  (${Math.round((1 - outKB/srcKB)*100)}% smaller)`);
}

const files = await walk(SRC_ROOT);
console.log(`\nCompressing ${files.length} photos…\n`);
for (const f of files) await compress(f);
console.log('\nDone. Compressed photos written to public/photos-web/\n');
