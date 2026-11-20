import { expect, test, type Locator } from '@playwright/test';

// Image delivery on the production build: every raster photo ships AVIF with
// the WebP `<img>` as its fallback, and only images above the fold on a
// desktop load eagerly at high priority. Everything else stays lazy. Content
// figures decode asynchronously even at high priority; only the hero decodes
// synchronously, as it did before AVIF.

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

/** High priority for a content figure, which still decodes off the main thread. */
async function expectFigurePriority(image: Locator) {
  await expectPriority(image);
  await expect(image).toHaveAttribute('decoding', 'async');
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
  await expectFigurePriority(portrait);

  const landscape = page.locator('.about-landscape img');
  await expectAvifWithWebpFallback(landscape);
  await expectLazy(landscape);
});

test('the first LiftDay screenshot loads at high priority, and every other image is lazy', async ({ page }) => {
  // Below 768px the gallery stacks, so only its first screenshot is reliably
  // above the fold.
  await page.goto('/work/liftday');
  const gallery = page.locator('.gallery').first().locator('img');
  await expect(gallery).toHaveCount(3);
  for (const image of await gallery.all()) await expectAvifWithWebpFallback(image);
  const first = gallery.first();
  await expectFigurePriority(first);
  for (const image of await page.locator('main img').all()) {
    if (await image.evaluate((el, first) => el === first, await first.elementHandle())) continue;
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

test('a hand-written picture keeps its default box', async ({ page }) => {
  // Only the image components' pictures give up their box, not every
  // `<picture>` a future post might write by hand.
  await page.goto('/');
  const display = await page.evaluate(() => {
    const picture = document.createElement('picture');
    document.querySelector('main')!.append(picture);
    return getComputedStyle(picture).display;
  });
  expect(display).toBe('inline');
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
