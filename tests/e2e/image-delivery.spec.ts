import { expect, test, type Locator } from '@playwright/test';

// Image delivery on the production build: every raster photo ships AVIF with
// the WebP `<img>` as its fallback, and only images above the fold on a
// desktop load eagerly at high priority. Everything else stays lazy.

/** Asserts the image sits in a `<picture>` offering the same widths as AVIF first. */
async function expectAvifWithWebpFallback(image: Locator) {
  await expect(image).toHaveAttribute('src', /\.webp$/);
  const sizes = await image.getAttribute('sizes');
  const avif = image.locator('xpath=parent::picture/source[1]');
  await expect(avif).toHaveAttribute('type', 'image/avif');
  await expect(avif).toHaveAttribute('srcset', /\.avif \d+w,.+\.avif \d+w/);
  await expect(avif).toHaveAttribute('sizes', sizes!);
}

async function expectPriority(image: Locator) {
  await expect(image).toHaveAttribute('loading', 'eager');
  await expect(image).toHaveAttribute('fetchpriority', 'high');
}

async function expectLazy(image: Locator) {
  await expect(image).toHaveAttribute('loading', 'lazy');
  await expect(image).not.toHaveAttribute('fetchpriority', /.*/);
}

test('the homepage hero ships AVIF with a WebP fallback and loads at high priority', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('.hero-image');
  await expectAvifWithWebpFallback(hero);
  await expectPriority(hero);
});

test('the About portrait loads at high priority; the landscape below it stays lazy', async ({ page }) => {
  await page.goto('/about');
  const portrait = page.locator('.about-portrait img');
  test.skip((await portrait.count()) === 0, 'the production build has no About portrait');
  await expectAvifWithWebpFallback(portrait);
  await expectPriority(portrait);

  const landscape = page.locator('.about-landscape img');
  await expectAvifWithWebpFallback(landscape);
  await expectLazy(landscape);
});

test('the LiftDay gallery after the intro loads at high priority, and every other image is lazy', async ({ page }) => {
  await page.goto('/work/liftday');
  const gallery = page.locator('.gallery').first().locator('img');
  await expect(gallery).toHaveCount(3);
  for (const image of await gallery.all()) {
    await expectAvifWithWebpFallback(image);
    await expectPriority(image);
  }
  const firstGallery = page.locator('.gallery').first();
  for (const image of await page.locator('main img').all()) {
    if (await image.evaluate((el, gallery) => gallery.contains(el), await firstGallery.elementHandle())) continue;
    await expectLazy(image);
  }
});

test('the picture wrapper leaves the image styles in place', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const hero = page.locator('.hero-image');
  await expect(hero).toHaveCSS('display', 'block');
  await expect(hero).toHaveCSS('object-fit', 'cover');
  await expect(hero).toHaveCSS('border-top-left-radius', /[1-9]/);
  await expect(page.locator('.hero-figure picture')).toHaveCSS('display', 'contents');
});

test.describe('on a 375px phone at 2x', () => {
  test.use({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });

  /** The width descriptor of the candidate the browser picked, from the AVIF source or the WebP `<img>`. */
  const chosenWidth = (image: Locator) =>
    image.evaluate((img: HTMLImageElement) => {
      const path = new URL(img.currentSrc).pathname;
      const sources = [...(img.parentElement?.querySelectorAll('source') ?? [])].map((source) => source.srcset);
      const match = [...sources, img.srcset]
        .flatMap((srcset) => srcset.split(','))
        .map((c) => c.trim().split(/\s+/))
        .find(([url]) => url === path);
      return Number(match?.[1]?.replace('w', ''));
    });

  // Each renders 327px wide inside the gutters, so 654 device pixels: the
  // 680w candidate, not the 960w one a `100vw` claim would pick.
  for (const [where, path, selector] of [
    ['the About landscape', '/about', '.about-landscape img'],
    ['the LiftDay gallery', '/work/liftday', '.gallery img'],
  ] as const) {
    test(`${where} picks the candidate its rendered width needs`, async ({ page }) => {
      await page.goto(path);
      const images = page.locator(selector);
      test.skip((await images.count()) === 0, `the production build has no ${where}`);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => chosenWidth(image)).toBe(680);
      }
    });
  }
});
