import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const theme of ['light', 'dark'] as const) {
  test(`homepage has no WCAG 2.2 AA violations in the ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
    const results = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
    expect(results.violations).toEqual([]);
  });
}
