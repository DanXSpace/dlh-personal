import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// The empty state exists only while the production build has no published
// projects; fixture tests cover the directory with projects (ADR-0004).
for (const theme of ['light', 'dark'] as const) {
  for (const width of [320, 1440]) {
    test(`the empty work directory has no WCAG 2.2 AA violations in the ${theme} theme at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/work');
      test.skip((await page.locator('.work-row').count()) > 0, 'the production build has published projects');
      await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
      const results = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
