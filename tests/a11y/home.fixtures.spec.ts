import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// The homepage with every section filled from fixture content (ADR-0004).
for (const theme of ['light', 'dark'] as const) {
  for (const width of [320, 768, 1440]) {
    test(`the homepage has no WCAG 2.2 AA violations in the ${theme} theme at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/');
      await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
      await expect(page.getByRole('region', { name: 'In the present' })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
