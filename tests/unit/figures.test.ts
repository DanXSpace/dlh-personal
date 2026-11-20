import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aboutLandscapeSizes, caseStudyImage, figureImage, figureLabel, galleryImageSizes } from '../../src/lib/figures.ts';

test('a figure caption takes the spec form, with a two-digit number and an uppercase label', () => {
  assert.equal(figureLabel(1, 'Roots'), 'FIG. 01 / ROOTS');
  assert.equal(figureLabel(12, 'blue mountains'), 'FIG. 12 / BLUE MOUNTAINS');
});

test('numbers past 99 keep all their digits', () => {
  assert.equal(figureLabel(100, 'Roots'), 'FIG. 100 / ROOTS');
});

test('surrounding whitespace in the label is dropped', () => {
  assert.equal(figureLabel(3, '  Roots '), 'FIG. 03 / ROOTS');
});

test('a number that is not a positive whole number fails the build with a fix', () => {
  for (const number of [0, -1, 1.5, Number.NaN]) {
    assert.throws(() => figureLabel(number, 'Roots'), /positive whole number/, String(number));
  }
});

test('an empty label fails the build with a fix', () => {
  for (const label of ['', '   ']) {
    assert.throws(() => figureLabel(1, label), /needs a short label/);
  }
});

// `sizes` against widths measured in Chromium on the built site (2026-11-20).
// Each value must claim at least the rendered width, so the browser never
// picks a candidate too small, and at most 10% more, so a 2x phone doesn't
// pick one candidate too large. The evaluator below reads only the subset of
// the `sizes` syntax these values use: `(min-width: Nrem)` conditions and
// lengths in rem, vw and calc().
function claimedWidth(sizes: string, viewport: number): number {
  for (const entry of sizes.split(/,\s*(?![^()]*\))/)) {
    const match = /^\(min-width: ([\d.]+)rem\) (.+)$/.exec(entry.trim());
    if (match && viewport < Number(match[1]) * 16) continue;
    const length = (match?.[2] ?? entry).trim();
    const expression = length
      .replace(/^calc/, '')
      .replace(/([\d.]+)rem/g, (_, n: string) => String(Number(n) * 16))
      .replace(/([\d.]+)vw/g, (_, n: string) => String((Number(n) * viewport) / 100));
    if (!/^[\d.+\-*/() ]+$/.test(expression)) throw new Error(`Unsupported sizes length: ${length}`);
    return Number(new Function(`return ${expression}`)());
  }
  throw new Error(`No sizes entry matched ${viewport}px: ${sizes}`);
}

function assertSizesFit(sizes: string, rendered: Record<number, number>) {
  for (const [viewport, width] of Object.entries(rendered)) {
    const claimed = claimedWidth(sizes, Number(viewport));
    assert.ok(claimed >= width - 1, `${viewport}px: claims ${claimed}px for a ${width}px image`);
    assert.ok(claimed <= width * 1.1, `${viewport}px: claims ${claimed}px for a ${width}px image`);
  }
}

test('a lone figure claims the reading column it renders at, inside the gutter on a phone', () => {
  assertSizesFit(figureImage.sizes, { 375: 327, 727: 679, 728: 680, 767: 680, 768: 672, 1440: 680 });
});

test('a gallery figure claims its column, and the reading column inside the gutter when stacked', () => {
  assertSizesFit(galleryImageSizes(2), { 375: 327, 728: 680, 767: 680, 768: 324, 1440: 328 });
  assertSizesFit(galleryImageSizes(3), { 375: 327, 728: 680, 767: 680, 768: 208, 1440: 211 });
});

test("a case study's wide image claims the content shell, inside the gutter at every width", () => {
  assertSizesFit(caseStudyImage.sizes, { 375: 327, 767: 719, 768: 672, 900: 798, 1023: 915, 1040: 931, 1440: 912 });
});

test('the About landscape claims its seven columns, and the content width when stacked', () => {
  assertSizesFit(aboutLandscapeSizes, { 375: 327, 767: 719, 768: 672, 900: 798, 1023: 915, 1024: 524, 1040: 533, 1440: 522 });
});
