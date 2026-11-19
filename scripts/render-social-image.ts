/**
 * Renders the default link-preview image, `public/social/default.png`
 * (architecture §10.2), at 1200 × 630 in the Quiet Precision style: the light
 * palette, Geist Sans and Geist Mono, and no copy beyond the approved name and
 * monogram. Run after `npm run build`, which downloads the fonts:
 *
 *   node scripts/render-social-image.ts
 */
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { site } from '../src/site.config.ts';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('dist/index.html', root), 'utf8');

/** A built Geist font file as a data URL, found in the homepage's @font-face rules. */
async function font(family: 'Geist' | 'Geist Mono', weight: number): Promise<string> {
  const pattern = new RegExp(
    `font-family:"?${family}-[0-9a-f]+"?;src:url\\("(/_astro/fonts/[0-9a-f]+\\.woff2)"\\)[^}]*font-weight:${weight};`,
  );
  const path = html.match(pattern)?.[1];
  if (!path) throw new Error(`No ${family} ${weight} font in dist/. Run \`npm run build\` first.`);
  const data = await readFile(new URL(`dist${path}`, root));
  return `data:font/woff2;base64,${data.toString('base64')}`;
}

// Light theme values from src/styles/tokens.css (design-spec §2).
const page = `<!doctype html>
<html>
<head>
<style>
  @font-face { font-family: Sans; src: url(${await font('Geist', 500)}); font-weight: 500; }
  @font-face { font-family: Mono; src: url(${await font('Geist Mono', 400)}); font-weight: 400; }
  * { margin: 0; }
  body {
    width: 1200px;
    height: 630px;
    box-sizing: border-box;
    padding: 72px 80px;
    display: grid;
    grid-template-rows: auto 1fr auto;
    background: #fafaf8;
    color: #171717;
  }
  .monogram { font: 400 28px/1 Mono; letter-spacing: 0.04em; color: #595959; }
  .name {
    grid-row: 3;
    margin-left: 33.333%;
    padding-top: 32px;
    border-top: 1px solid #d6d6d2;
    font: 500 76px/1.05 Sans;
    letter-spacing: -0.02em;
  }
</style>
</head>
<body>
  <p class="monogram">${site.monogram}</p>
  <p class="name">${site.name}</p>
</body>
</html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await tab.setContent(page);
await tab.evaluate(() => document.fonts.ready);
await tab.screenshot({ path: new URL('public/social/default.png', root).pathname });
await browser.close();
