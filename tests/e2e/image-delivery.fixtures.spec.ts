import { expect, test, type Locator, type Page } from '@playwright/test';

// Image delivery on the fixture build (ADR-0004), which has every kind of
// raster image: each ships AVIF first with the WebP `<img>` as its fallback.
// SVG diagrams are served as they are. Only the hero and the About portrait
// load at high priority; the rest stay lazy unless they say otherwise.

async function expectAvifWithWebpFallback(image: Locator) {
  await expect(image).toHaveAttribute('src', /\.webp$/);
  const avif = image.locator('xpath=parent::picture/source[1]');
  await expect(avif).toHaveAttribute('type', 'image/avif');
  await expect(avif).toHaveAttribute('srcset', /\.avif \d+w/);
  await expect(avif).toHaveAttribute('sizes', (await image.getAttribute('sizes'))!);
}

async function rasterImages(page: Page, selector: string) {
  const images = page.locator(selector);
  expect(await images.count()).toBeGreaterThan(0);
  return images.all();
}

for (const [where, path, selector] of [
  ['homepage selected work thumbnails', '/', '.project-thumbnail'],
  ['/work thumbnails', '/work', '.project-thumbnail'],
  ["a case study's wide image", '/work/case-study-fixture', '.case-study-image'],
  ['About interest tiles', '/about', '.interest-photo'],
  ['About figures', '/about', '.figure-image'],
  ['figures and galleries in an article', '/writing/mdx-components-fixture', '.figure-image'],
  ['raster diagrams', '/writing/mdx-components-fixture', 'img.diagram-image:not([src$=".svg"])'],
] as const) {
  test(`${where} ship AVIF with a WebP fallback`, async ({ page }) => {
    await page.goto(path);
    for (const image of await rasterImages(page, selector)) await expectAvifWithWebpFallback(image);
  });
}

test('SVG diagrams are served as SVG, without a picture wrapper', async ({ page }) => {
  await page.goto('/writing/mdx-components-fixture');
  const svgs = page.locator('img[src$=".svg"]');
  test.skip((await svgs.count()) === 0, 'the fixture has no SVG image diagram');
  for (const image of await svgs.all()) {
    await expect(image.locator('xpath=parent::picture')).toHaveCount(0);
  }
});

test('the About portrait loads at high priority; every other About image stays lazy', async ({ page }) => {
  await page.goto('/about');
  const portrait = page.locator('.about-portrait img');
  await expect(portrait).toHaveAttribute('loading', 'eager');
  await expect(portrait).toHaveAttribute('fetchpriority', 'high');
  for (const image of await page.locator('main img:not(.about-portrait img)').all()) {
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).not.toHaveAttribute('fetchpriority', /.*/);
  }
});

test('figures and galleries in an article stay lazy by default', async ({ page }) => {
  await page.goto('/writing/mdx-components-fixture');
  for (const image of await page.locator('.figure-image').all()) {
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).not.toHaveAttribute('fetchpriority', /.*/);
  }
});

for (const width of [390, 1440]) {
  test(`at ${width}px the picture wrapper leaves a /work thumbnail on its grid columns`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/work');
    const row = page.locator('.project-row:has(.project-thumbnail)').first();
    const thumbnail = (await row.locator('.project-thumbnail').boundingBox())!;
    const body = (await row.locator('.project-body').boundingBox())!;
    if (width >= 768) {
      // Four of twelve columns beside the text, not a full-width block above it.
      expect(thumbnail.width).toBeLessThan(body.width);
      expect(thumbnail.x + thumbnail.width).toBeLessThanOrEqual(body.x);
    } else {
      expect(thumbnail.y + thumbnail.height).toBeLessThanOrEqual(body.y);
    }
  });
}
