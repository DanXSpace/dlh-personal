import { expect, test } from '@playwright/test';

// Narrowest and widest review widths (design-spec §7).
const reviewWidths = [320, 1440];

for (const width of reviewWidths) {
  test(`homepage renders without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);

    const widths = await page.evaluate(() => {
      const root = document.documentElement;
      return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
    });
    expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth);
  });
}
