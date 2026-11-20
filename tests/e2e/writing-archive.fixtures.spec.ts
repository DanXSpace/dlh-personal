import { expect, test, type Page } from '@playwright/test';

// Fixture articles in tests/fixtures/content/writing (ADR-0004). The draft
// fixture is the only `life` article and nothing is filed under `technology`.

function years(page: Page) {
  return page.locator('.archive-year');
}

test.describe('the writing archive', () => {
  test('is titled Writing, with its deck and introduction', async ({ page }) => {
    await page.goto('/writing');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writing.');
    await expect(page).toHaveTitle('Writing — Daniel Lee Holung');
    const header = page.getByRole('main').locator('header');
    await expect(header).toContainText('Thinking in public.');
    await expect(header).toContainText('I write to make sense of things.');
  });

  test('lists published articles newest first, grouped by year, without drafts', async ({ page }) => {
    await page.goto('/writing');
    await expect(years(page).getByRole('heading', { level: 2 })).toHaveText(['2026', '2025']);
    await expect(years(page).nth(0).getByRole('heading', { level: 3 })).toHaveText([
      'MDX components fixture',
      'Article template fixture',
      'A much longer title fixture for checking how article headings and their metadata wrap on narrow screens',
      'Contents opt-in fixture',
    ]);
    await expect(years(page).nth(1).getByRole('heading', { level: 3 })).toHaveText(['Earlier year fixture']);
    await expect(page.getByText('Draft fixture')).toHaveCount(0);
  });

  test('each row links to its article and shows the date, category and reading time', async ({ page }) => {
    await page.goto('/writing');
    const row = page.getByRole('listitem').filter({ hasText: 'Article template fixture' });
    await expect(row.getByRole('link', { name: 'Article template fixture' })).toHaveAttribute(
      'href',
      '/writing/article-template-fixture',
    );
    await expect(row.locator('time[datetime="2026-03-14"]')).toHaveText('March 14, 2026');
    await expect(row).toContainText('Engineering');
    await expect(row).toContainText(/\b\d+ min read\b/);
  });

  test('Writing is the current page in the navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/writing');
    const writing = page.getByRole('banner').getByRole('link', { name: 'Writing', exact: true });
    await expect(writing).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('category filter', () => {
  test('links to All and each category that has published articles, in category order', async ({ page }) => {
    await page.goto('/writing');
    const filter = page.getByRole('navigation', { name: 'Categories' });
    await expect(filter.getByRole('link')).toHaveText(['All', 'Engineering', 'Build logs', 'Learning']);
    await expect(filter.getByRole('link', { name: 'Learning' })).toHaveAttribute(
      'href',
      '/writing/category/learning',
    );
  });

  test('marks All as current on the archive with a non-color cue', async ({ page }) => {
    await page.goto('/writing');
    const filter = page.getByRole('navigation', { name: 'Categories' });
    const all = filter.getByRole('link', { name: 'All' });
    await expect(all).toHaveAttribute('aria-current', 'page');
    await expect(all).toHaveCSS('text-decoration-line', 'underline');
    await expect(filter.getByRole('link', { name: 'Engineering' })).not.toHaveCSS('text-decoration-line', 'underline');
  });

  for (const category of ['life', 'technology']) {
    test(`a category with no published articles (${category}) has no page`, async ({ page }) => {
      const response = await page.goto(`/writing/category/${category}`);
      expect(response?.status()).toBe(404);
    });
  }
});

test.describe('a category page', () => {
  test('lists only that category, newest first, grouped by year', async ({ page }) => {
    await page.goto('/writing/category/learning');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writing.');
    // The deck and introduction belong to the full archive only.
    await expect(page.getByRole('main')).not.toContainText('Thinking in public.');
    await expect(page).toHaveTitle('Learning — Writing — Daniel Lee Holung');
    await expect(years(page).getByRole('heading', { level: 2 })).toHaveText(['2026', '2025']);
    await expect(years(page).getByRole('heading', { level: 3 })).toHaveText([
      'Contents opt-in fixture',
      'Earlier year fixture',
    ]);
  });

  test('marks its own filter link as current and keeps Writing active in the navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/writing/category/learning');
    const filter = page.getByRole('navigation', { name: 'Categories' });
    await expect(filter.getByRole('link', { name: 'Learning' })).toHaveAttribute('aria-current', 'page');
    await expect(filter.getByRole('link', { name: 'Learning' })).toHaveCSS('text-decoration-line', 'underline');
    await expect(filter.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current');

    const writing = page.getByRole('banner').getByRole('link', { name: 'Writing', exact: true });
    await expect(writing).not.toHaveAttribute('aria-current');
    await expect(writing).toHaveCSS('text-decoration-line', 'underline');
  });
});

// Review widths from design-spec §7.
for (const width of [320, 390, 768, 1024, 1440]) {
  for (const path of ['/writing', '/writing/category/build-logs']) {
    test(`${path} never scrolls horizontally and long titles stay clickable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);

      // Wrapped metadata must not sit over the link: a real click at its centre reaches the article.
      const link = page.getByRole('link', { name: /^A much longer title fixture/ });
      await link.click();
      await expect(page).toHaveURL(/\/writing\/a-much-longer-title-fixture-for-checking-how-article-headings-wrap$/);
    });
  }
}
