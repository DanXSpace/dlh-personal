import { expect, test } from '@playwright/test';

// The production build has no published articles yet, so this is the empty state.
test.describe('the writing archive with no published articles', () => {
  for (const width of [320, 1440]) {
    test(`renders a clean empty state with no filter links at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto('/writing');
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writing');
      await expect(page.getByText('No articles published yet.')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Categories' })).toHaveCount(0);
      await expect(page.locator('.archive-year')).toHaveCount(0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('produces no category pages', async ({ page }) => {
    const response = await page.goto('/writing/category/engineering');
    expect(response?.status()).toBe(404);
  });
});
