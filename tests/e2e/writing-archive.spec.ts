import { expect, test, type Page } from '@playwright/test';

/**
 * The empty state can only be seen in a build with no published articles,
 * which today is the production build. Fixture tests cover the archive with
 * articles (ADR-0004); these skip themselves once real articles are published.
 */
async function skipUnlessEmpty(page: Page) {
  await page.goto('/writing');
  test.skip((await page.locator('.archive-year').count()) > 0, 'the production build has published articles');
}

test.describe('the writing archive with no published articles', () => {
  for (const width of [320, 1440]) {
    test(`renders a clean empty state with no filter links at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await skipUnlessEmpty(page);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writing.');
      await expect(page.getByText('Nothing published yet. More to come.')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Categories' })).toHaveCount(0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('produces no category pages', async ({ page }) => {
    await skipUnlessEmpty(page);
    const response = await page.goto('/writing/category/engineering');
    expect(response?.status()).toBe(404);
  });
});
