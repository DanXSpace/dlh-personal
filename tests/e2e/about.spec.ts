import { expect, test, type Page } from '@playwright/test';

/**
 * The production build has no About entry until the owner's copy arrives
 * (ticket 18), so `/about` shows only the approved opener and invents nothing.
 * Fixture tests cover the page with content (ADR-0004); these skip themselves
 * once a real About entry is published.
 */
async function skipUnlessEmpty(page: Page) {
  const response = await page.goto('/about');
  expect(response?.status()).toBe(200);
  test.skip((await page.locator('main section, main figure').count()) > 0, 'the production build has an About entry');
}

test('the About page is titled About and marks About as the current page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about');
  await expect(page).toHaveTitle('About — Daniel Lee Holung');
  const about = page.getByRole('banner').getByRole('link', { name: 'About', exact: true });
  await expect(about).toHaveAttribute('aria-current', 'page');
});

test.describe('the About page with no About entry', () => {
  for (const width of [320, 1440]) {
    test(`shows only the opener, with no sections, images or invented copy, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await skipUnlessEmpty(page);
      await expect(page).toHaveTitle('About — Daniel Lee Holung');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('More than an engineer.');
      await expect(page.getByRole('main').getByRole('heading')).toHaveCount(1);
      await expect(page.getByRole('main').getByRole('img')).toHaveCount(0);
      await expect(page.getByRole('main').locator('p, li')).toHaveCount(0);
      await expect(page.getByRole('main')).not.toContainText(/fixture/i);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
