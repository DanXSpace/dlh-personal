import { expect, test, type Page } from '@playwright/test';

/**
 * The empty state can only be seen in a build with no published projects,
 * which today is the production build. Fixture tests cover the directory with
 * projects (ADR-0004); these skip themselves once real projects are published.
 */
async function skipUnlessEmpty(page: Page) {
  await page.goto('/work');
  test.skip((await page.locator('.work-row').count()) > 0, 'the production build has published projects');
}

test.describe('the work directory with no published projects', () => {
  for (const width of [320, 1440]) {
    test(`renders a clean empty state at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await skipUnlessEmpty(page);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Things I’ve built.');
      await expect(page.getByText('No projects published yet.')).toBeVisible();
      await expect(page.getByRole('main').getByRole('list')).toHaveCount(0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
