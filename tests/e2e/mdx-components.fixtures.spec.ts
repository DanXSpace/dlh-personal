import { expect, test } from '@playwright/test';

// The MDX fixture article in tests/fixtures/content/writing (ADR-0004).
const mdx = '/writing/mdx-components-fixture';

test('an MDX article renders through the article page like a Markdown one', async ({ page }) => {
  await page.goto(mdx);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('MDX components fixture');
  await expect(page.getByRole('article').locator('header')).toContainText(/\b\d+ min read\b/);
  const heading = page.locator('.prose h2#markdown-still-works');
  await expect(heading).toHaveText('Markdown still works');
  await expect(page.locator('.prose a.heading-anchor[href="#markdown-still-works"]')).toBeVisible();
  await expect(page.locator('.prose').getByRole('link', { name: 'underlined links' })).toHaveCSS(
    'text-decoration-line',
    'underline',
  );
});

test('MDX code blocks are highlighted with token classes and the page carries no inline styles', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  await page.goto(mdx);
  const code = page.getByRole('region', { name: 'Code: TypeScript' });
  await expect(code.locator('.token-keyword').first()).toHaveCSS('font-weight', '500');
  await expect(page.locator('.prose [style]')).toHaveCount(0);
  expect(violations).toEqual([]);
});

test.describe('Callout', () => {
  test('sets an aside apart with a rule and a mono label, defaulting to Note', async ({ page }) => {
    await page.goto(mdx);
    const callouts = page.locator('.prose aside.callout');
    await expect(callouts).toHaveCount(2);

    const note = callouts.first();
    await expect(note.locator('.callout-label')).toHaveText('Note');
    await expect(note.locator('.callout-label')).toHaveCSS('font-family', /Geist Mono/);
    await expect(note).toContainText('A callout sets a short aside apart from the prose.');
    await expect(note).toHaveCSS('border-inline-start-style', 'solid');

    await expect(callouts.nth(1).locator('.callout-label')).toHaveText('Trade-off');
  });
});

test.describe('Figure', () => {
  test('renders an optimized, responsive image with reserved dimensions and alt text', async ({ page }) => {
    await page.goto(mdx);
    const image = page.getByRole('img', { name: 'A gray placeholder ridgeline under a pale sky.' });
    await expect(image).toHaveAttribute('width', /^\d+$/);
    await expect(image).toHaveAttribute('height', /^\d+$/);
    await expect(image).toHaveAttribute('src', /^\/_astro\/.+\.webp$/);
    await expect(image).toHaveAttribute('srcset', /\d+w,.+\d+w/);
    await expect(image).toHaveAttribute('sizes', /.+/);
    await expect(image).toHaveAttribute('loading', 'lazy');

    // The reserved box keeps the source's 16:10 shape and fits the column.
    const box = (await image.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(1.6, 1);
    const prose = (await page.locator('.prose').boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(prose.width);
  });

  test('captions the image in the spec form, in Geist Mono', async ({ page }) => {
    await page.goto(mdx);
    const figure = page.getByRole('figure', { name: 'FIG. 01 / ROOTS' });
    await expect(figure).toBeVisible();
    await expect(figure.locator('figcaption')).toHaveCSS('font-family', /Geist Mono/);
  });

  test('stands apart from the next block, so its caption is not read as the next image\'s', async ({ page }) => {
    await page.goto(mdx);
    const first = (await page.getByRole('figure', { name: 'FIG. 01 / ROOTS' }).boundingBox())!;
    const second = (await page.locator('.prose > figure').nth(1).boundingBox())!;
    expect(second.y - (first.y + first.height)).toBeGreaterThanOrEqual(48);
  });

  test('can follow the label with a short caption sentence', async ({ page }) => {
    await page.goto(mdx);
    const caption = page.locator('figure').filter({ hasText: 'FIG. 02 / RIDGELINE' }).locator('figcaption');
    await expect(caption).toContainText('A figure can add a short sentence after its label.');
  });
});

test.describe('Gallery', () => {
  const boxes = async (page: import('@playwright/test').Page, gallery: number) => {
    const figures = page.locator('.prose .gallery').nth(gallery).locator('figure');
    await expect(figures).toHaveCount(3);
    return Promise.all((await figures.all()).map(async (figure) => (await figure.boundingBox())!));
  };

  test('stacks its figures on a phone without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(mdx);
    for (const gallery of [0, 1]) {
      const [a, b, c] = await boxes(page, gallery);
      expect(a!.x).toBe(b!.x);
      expect(b!.x).toBe(c!.x);
      expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height);
      expect(c!.y).toBeGreaterThanOrEqual(b!.y + b!.height);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('lays its figures out side by side on the grid from 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto(mdx);
    const prose = (await page.locator('.prose').boundingBox())!;

    const [a, b, c] = await boxes(page, 0);
    expect(b!.y).toBe(a!.y);
    expect(b!.x).toBeGreaterThan(a!.x + a!.width);
    expect(c!.x).toBe(a!.x);
    expect(c!.y).toBeGreaterThan(a!.y);

    const [d, e, f] = await boxes(page, 1);
    expect(e!.y).toBe(d!.y);
    expect(f!.y).toBe(d!.y);
    expect(f!.x + f!.width).toBeLessThanOrEqual(prose.x + prose.width + 1);
  });

  test('a gallery figure can carry a caption sentence', async ({ page }) => {
    await page.goto(mdx);
    const caption = page.locator('.gallery figure').filter({ hasText: 'FIG. 04 / NOON' }).locator('figcaption');
    await expect(caption).toContainText('A gallery figure can carry a caption sentence too.');
  });

  // The candidate the browser picks shows whether `sizes` matches the figure's real width.
  const chosenWidth = (image: import('@playwright/test').Locator) =>
    image.evaluate((img: HTMLImageElement) => {
      // The chosen candidate can come from the `<picture>`'s AVIF source or the WebP `<img>`.
      const path = new URL(img.currentSrc).pathname;
      const sources = [...(img.parentElement?.querySelectorAll('source') ?? [])].map((source) => source.srcset);
      const match = [...sources, img.srcset]
        .flatMap((srcset) => srcset.split(','))
        .map((c) => c.trim().split(/\s+/))
        .find(([url]) => url === path);
      return Number(match?.[1]?.replace('w', ''));
    });

  test('downloads images sized for its columns, not for the full reading column', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(mdx);
    // A lone figure fills the 680px column; gallery figures are a half or a third of it.
    const lone = page.getByRole('img', { name: 'A gray placeholder ridgeline under a pale sky.' });
    await lone.scrollIntoViewIfNeeded();
    await expect.poll(() => chosenWidth(lone)).toBe(680);
    for (const name of ['A gray placeholder ridgeline, repeated in the gallery.', 'A wide placeholder in a three-up gallery.']) {
      const image = page.getByRole('img', { name });
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => chosenWidth(image)).toBe(480);
    }
  });
});

// Text colors from docs/design-spec.md §2.
const textColor = { light: 'rgb(23, 23, 23)', dark: 'rgb(244, 244, 242)' };

test.describe('Diagram', () => {
  const svgName = 'Diagram of the build: content flows through Astro to static files.';
  const svgDescription = /Markdown and MDX content goes into Astro/;

  test('an inline SVG diagram is one image with a short name and its text equivalent as a description', async ({
    page,
  }) => {
    await page.goto(mdx);
    const figure = page.getByRole('figure', { name: 'FIG. 09 / BUILD' });
    const art = figure.getByRole('img', { name: svgName });
    await expect(art).toBeVisible();
    await expect(art).toHaveAccessibleDescription(svgDescription);
    // SVG presentation attributes written in MDX reach the browser.
    await expect(art.locator('svg text').first()).toHaveCSS('text-anchor', 'middle');
  });

  test('an image diagram has alt text and its text equivalent as a description', async ({ page }) => {
    await page.goto(mdx);
    const figure = page.getByRole('figure', { name: 'FIG. 10 / FLOW' });
    const image = figure.getByRole('img', { name: 'Diagram of two boxes joined by a line.' });
    await expect(image).toHaveAttribute('width', /^\d+$/);
    await expect(image).toHaveAttribute('height', /^\d+$/);
    await expect(image).toHaveAccessibleDescription(/The left box hands its output to the right box\./);
  });

  test('the text equivalent is a disclosure anyone can open', async ({ page }) => {
    await page.goto(mdx);
    const figure = page.getByRole('figure', { name: 'FIG. 09 / BUILD' });
    const description = figure.getByText(svgDescription);
    await expect(description).toBeHidden();
    const summary = figure.getByText('Text description');
    const marker = () => summary.evaluate((el) => getComputedStyle(el, '::after').content);
    expect(await marker()).toContain('+');
    await summary.click();
    await expect(description).toBeVisible();
    expect(await marker()).toContain('−');
  });

  test('is static: no scripts, canvases or inline styles', async ({ page }) => {
    await page.goto(mdx);
    const diagrams = page.locator('.prose .diagram');
    await expect(diagrams).toHaveCount(2);
    await expect(diagrams.locator('script, canvas, [style]')).toHaveCount(0);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`inline SVG strokes and text follow the ${theme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(mdx);
      const art = page.getByRole('img', { name: svgName });
      await expect(art.locator('svg text').first()).toHaveCSS('fill', textColor[theme]);
      await expect(art.locator('svg rect').first()).toHaveCSS('stroke', textColor[theme]);
    });
  }
});

test.describe('Meta', () => {
  test('lists terms and values in order, joining lists and leaving out empty ones', async ({ page }) => {
    await page.goto(mdx);
    const meta = page.locator('.prose dl.meta');
    await expect(meta.locator('dt')).toHaveText(['Type', 'Year', 'Stack']);
    await expect(meta.locator('dd')).toHaveText(['Fixture', '2026', 'Astro, MDX, TypeScript']);
  });

  test('labels terms in uppercase Geist Mono', async ({ page }) => {
    await page.goto(mdx);
    const term = page.locator('.prose dl.meta dt').first();
    await expect(term).toHaveCSS('font-family', /Geist Mono/);
    await expect(term).toHaveCSS('text-transform', 'uppercase');
  });
});
