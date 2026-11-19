import { expect, test } from '@playwright/test';

// Fixture articles in tests/fixtures/content/writing (ADR-0004).
const full = '/writing/article-template-fixture';
const short = '/writing/a-much-longer-title-fixture-for-checking-how-article-headings-wrap';
const optIn = '/writing/contents-opt-in-fixture';
const draft = '/writing/draft-fixture';
const mdx = '/writing/mdx-components-fixture';

test.describe('article header', () => {
  test('shows category, publication date, title, deck, author, reading time and updated date', async ({ page }) => {
    await page.goto(full);
    const header = page.getByRole('article').locator('header');
    await expect(header).toContainText('Engineering');
    await expect(header.locator('time[datetime="2026-03-14"]')).toHaveText('March 14, 2026');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Article template fixture');
    await expect(header).toContainText('A fixture for browser and accessibility tests.');
    await expect(header).toContainText('By Daniel Lee Holung');
    await expect(header).toContainText(/\b\d+ min read\b/);
    await expect(header.locator('time[datetime="2026-04-02"]')).toHaveText('April 2, 2026');
    await expect(header).toContainText('Updated April 2, 2026');
  });

  test('leaves out the deck and updated date when the article has none', async ({ page }) => {
    await page.goto(short);
    const header = page.getByRole('article').locator('header');
    await expect(header).toContainText('Build logs');
    await expect(header).toContainText('1 min read');
    await expect(header).not.toContainText('Updated');
    await expect(header.locator('p')).toHaveCount(2);
  });

  test('the page title names the article', async ({ page }) => {
    await page.goto(full);
    await expect(page).toHaveTitle('Article template fixture — Daniel Lee Holung');
  });

  test('Writing is the active parent section, without aria-current', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(full);
    const writing = page.getByRole('banner').getByRole('link', { name: 'Writing', exact: true });
    await expect(writing).not.toHaveAttribute('aria-current');
    await expect(writing).toHaveCSS('text-decoration-line', 'underline');
  });
});

// The fixture build is a production build (`import.meta.env.PROD`), so it applies the draft rule.
test('a draft fixture is absent from the built site', async ({ page }) => {
  const response = await page.goto(draft);
  expect(response?.status()).toBe(404);
});

test.describe('headings and contents', () => {
  test('every section heading has an id and a visible anchor link to it', async ({ page }) => {
    await page.goto(full);
    const headings = page.locator('.prose :is(h2, h3)');
    await expect(headings).toHaveCount(6);
    for (const heading of await headings.all()) {
      const id = await heading.getAttribute('id');
      expect(id).toMatch(/^[a-z0-9-]+$/);
      const anchor = page.locator(`.prose a.heading-anchor[href="#${id}"]`);
      await expect(anchor).toBeVisible();
      await expect(anchor).toHaveAccessibleName(`Link to this section: ${await heading.textContent()}`);
    }

    await page.locator('a.heading-anchor[href="#code"]').click();
    await expect(page).toHaveURL(/#code$/);
  });

  test('an article with three or more h2s gets a table of contents with h3s nested', async ({ page }) => {
    await page.goto(full);
    const contents = page.getByRole('navigation', { name: 'Contents' });
    await expect(contents.locator(':scope > ol > li > a')).toHaveText([
      'Prose and lists',
      'Code',
      'Tables and quotes',
      'Summary',
    ]);
    await expect(contents.locator('ol ol a')).toHaveText(['A nested heading', 'Closing heading']);

    await contents.getByRole('link', { name: 'Tables and quotes' }).click();
    await expect(page).toHaveURL(/#tables-and-quotes$/);
    await expect(page.locator('#tables-and-quotes')).toBeInViewport();
  });

  test('an article with fewer than three h2s has no table of contents', async ({ page }) => {
    await page.goto(short);
    await expect(page.getByRole('navigation', { name: 'Contents' })).toHaveCount(0);
  });

  test('frontmatter can opt a short article in to a table of contents', async ({ page }) => {
    await page.goto(optIn);
    const contents = page.getByRole('navigation', { name: 'Contents' });
    await expect(contents.getByRole('link')).toHaveText(['The only section']);
  });
});

test.describe('prose', () => {
  test('uses the 680px reading column, 18px/1.75 body text and underlined links', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(full);
    const prose = page.locator('.prose');
    expect((await prose.boundingBox())!.width).toBeLessThanOrEqual(680);
    const paragraph = prose.locator('> p').first();
    await expect(paragraph).toHaveCSS('font-size', '18px');
    await expect(paragraph).toHaveCSS('line-height', '31.5px');
    await expect(prose.getByRole('link', { name: 'the Astro documentation' })).toHaveCSS(
      'text-decoration-line',
      'underline',
    );
  });
});

// Muted text from docs/design-spec.md §2.
const muted = { light: 'rgb(89, 89, 89)', dark: 'rgb(181, 181, 181)' };

test.describe('code', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`is syntax-highlighted in the ${theme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(full);
      const code = page.getByRole('region', { name: 'Code: TypeScript' });
      await expect(code.locator('.token-comment').first()).toHaveCSS('color', muted[theme]);
      await expect(code.locator('.token-keyword').first()).toHaveCSS('font-weight', '500');
      await expect(code.locator('.token-constant').first()).not.toHaveCSS('color', muted[theme]);
    });
  }

  test('carries no inline styles for the content security policy to block', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (message) => {
      if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
    });
    await page.goto(full);
    await expect(page.locator('.prose [style]')).toHaveCount(0);
    expect(violations).toEqual([]);
  });
});

test.describe('at 320px', () => {
  test.use({ viewport: { width: 320, height: 800 } });

  for (const path of [full, short, optIn, mdx]) {
    test(`${path} never scrolls horizontally`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  for (const name of ['Code: TypeScript', 'Table']) {
    test(`the wide ${name === 'Table' ? 'table' : 'code block'} scrolls in its own region by keyboard`, async ({
      page,
    }) => {
      await page.goto(full);
      const region = page.getByRole('region', { name, exact: true });
      const { scrollWidth, clientWidth } = await region.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(scrollWidth).toBeGreaterThan(clientWidth);

      await region.focus();
      await expect(region).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    });
  }
});

test.describe('contents placement', () => {
  test('at 1024px and up the contents sit beside the reading column', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(full);
    const contents = await page.getByRole('navigation', { name: 'Contents' }).boundingBox();
    const prose = await page.locator('.prose').boundingBox();
    expect(contents!.x).toBeGreaterThanOrEqual(prose!.x + prose!.width);
  });

  test('below 1024px the contents come before the article body', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto(full);
    const contents = await page.getByRole('navigation', { name: 'Contents' }).boundingBox();
    const prose = await page.locator('.prose').boundingBox();
    expect(contents!.y + contents!.height).toBeLessThanOrEqual(prose!.y);
  });
});

test('keyboard focus reaches the code and table regions in reading order', async ({ page }) => {
  await page.goto(full);
  const order: string[] = [];
  for (let i = 0; i < 60 && order.length < 3; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() =>
      document.activeElement?.getAttribute('role') === 'region' ? document.activeElement.getAttribute('aria-label') : null,
    );
    if (label) order.push(label);
  }
  expect(order).toEqual(['Code: TypeScript', 'Code', 'Table']);
});
