#!/usr/bin/env node
/**
 * Generates every favicon / app / PWA icon from the master logo.
 *
 *   Source of truth: public/brand/logo-mark.svg  (edit this, then re-run)
 *   Usage:           node scripts/generate-icons.mjs
 *
 * Outputs
 *   src/app/favicon.ico          16/32/48 multi-size ICO (legacy browsers, /favicon.ico)
 *   src/app/icon.svg             scalable favicon for modern browsers
 *   src/app/apple-icon.png       180x180 opaque full-bleed (iOS adds its own rounding)
 *   public/icons/icon-*.png      PWA "any" icons (rounded tile, transparent corners)
 *   public/icons/maskable-*.png  PWA "maskable" icons (full-bleed, glyph inside 80% safe zone)
 *   public/icons/shortcut-*.png  96x96 icons for manifest shortcuts
 *   public/brand/logo-512.png    raster logo for structured data / press
 */
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const p = (...parts) => path.join(root, ...parts);

const master = await readFile(p('public/brand/logo-mark.svg'), 'utf8');
const defs = master.match(/<defs>[\s\S]*?<\/defs>/)[0];
const glyph = master.match(/<g id="glyph">[\s\S]*?<\/g>/)[0];

const svg = body =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}${body}</svg>`;

// Glyph scaled about the canvas centre.
const scaled = scale =>
  `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${glyph}</g>`;

const fullBleed = scale => svg(`<rect width="512" height="512" fill="url(#bg)"/>${scaled(scale)}`);

const tileWith = icon =>
  svg(
    `<rect width="512" height="512" rx="116" fill="url(#bg)"/>` +
      `<g fill="none" stroke="#FFFFFF" stroke-width="40" stroke-linecap="round" stroke-linejoin="round">${icon}</g>`
  );

const variants = {
  tile: master,
  // Maskable safe zone is a circle of radius 40% — the glyph spans ~0.82 of the canvas, so 0.74 keeps it inside.
  maskable: fullBleed(0.74),
  apple: fullBleed(0.84),
  shortcutAnimal: tileWith('<path d="M256 150v212M150 256h212"/>'),
  shortcutMilk: tileWith(
    '<path d="M256 120c-52 70-90 122-90 170a90 90 0 0 0 180 0c0-48-38-100-90-170z"/>'
  ),
};

const png = (src, size) =>
  sharp(Buffer.from(src), { density: Math.max(72, (72 * size) / 128) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();

// ICO with embedded PNG frames (supported by every browser since IE/Vista).
function ico(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = 6 + 16 * frames.length;
  const entries = frames.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...frames.map(f => f.data)]);
}

await mkdir(p('public/icons'), { recursive: true });

const outputs = [
  ['public/icons/icon-192.png', variants.tile, 192],
  ['public/icons/icon-512.png', variants.tile, 512],
  ['public/icons/maskable-192.png', variants.maskable, 192],
  ['public/icons/maskable-512.png', variants.maskable, 512],
  ['public/icons/shortcut-add-animal.png', variants.shortcutAnimal, 96],
  ['public/icons/shortcut-log-milk.png', variants.shortcutMilk, 96],
  ['public/brand/logo-512.png', variants.tile, 512],
];

for (const [file, src, size] of outputs) {
  await writeFile(p(file), await png(src, size));
  console.log(`✓ ${file} (${size}x${size})`);
}

// iOS ignores transparency (renders it black), so flatten onto the brand colour.
await writeFile(
  p('src/app/apple-icon.png'),
  await sharp(await png(variants.apple, 180)).flatten({ background: '#047857' }).png().toBuffer()
);
console.log('✓ src/app/apple-icon.png (180x180)');

const frames = await Promise.all([16, 32, 48].map(async size => ({ size, data: await png(variants.tile, size) })));
await writeFile(p('src/app/favicon.ico'), ico(frames));
console.log('✓ src/app/favicon.ico (16, 32, 48)');

await copyFile(p('public/brand/logo-mark.svg'), p('src/app/icon.svg'));
console.log('✓ src/app/icon.svg');
