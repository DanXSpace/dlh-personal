/**
 * Renders raster fallbacks for `public/favicon.svg` (design-spec §1) in the
 * light palette, for clients that can't use the SVG:
 *
 * - `public/favicon.ico`: 16 × 16 and 32 × 32, for anything that requests
 *   `/favicon.ico` directly. Keeps the SVG's rounded corners.
 * - `public/apple-touch-icon.png`: 180 × 180, square and opaque, because iOS
 *   applies its own corner mask.
 *
 * Rerun after changing the SVG:
 *
 *   node scripts/render-favicons.ts
 */
import { readFile, writeFile } from 'node:fs/promises';
import { chromium, type Page } from '@playwright/test';

const root = new URL('../', import.meta.url);
const svg = await readFile(new URL('public/favicon.svg', root), 'utf8');
const squareSvg = svg.replace(/ rx="[^"]*"/, '');

/** The SVG drawn at `size` pixels square, as PNG bytes; transparent outside the artwork. */
async function renderPng(tab: Page, source: string, size: number): Promise<Buffer> {
  await tab.setViewportSize({ width: size, height: size });
  await tab.setContent(
    `<!doctype html><style>* { margin: 0; } svg { display: block; width: ${size}px; height: ${size}px; }</style>${source}`,
  );
  return tab.screenshot({ omitBackground: true });
}

/** An ICO file holding PNG-encoded images (allowed since Windows Vista). */
function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = header.length + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette colours: none
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

const browser = await chromium.launch();
// The SVG switches palette with prefers-color-scheme; raster fallbacks use the light one.
const tab = await browser.newPage({ colorScheme: 'light', deviceScaleFactor: 1 });

const icoImages = [];
for (const size of [16, 32]) icoImages.push({ size, png: await renderPng(tab, svg, size) });
await writeFile(new URL('public/favicon.ico', root), ico(icoImages));
await writeFile(new URL('public/apple-touch-icon.png', root), await renderPng(tab, squareSvg, 180));

await browser.close();
