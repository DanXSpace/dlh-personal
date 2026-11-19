import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Full-text search results (ticket 17) against the fixture build's index.

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const theme of ['light', 'dark'] as const) {
  for (const width of [320, 1440]) {
    test(`full-text results with excerpts have no WCAG 2.2 AA violations in the ${theme} theme at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/');
      await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
      await page.keyboard.press('Control+k');
      const palette = page.getByRole('dialog', { name: 'Search' });
      await expect(palette.getByRole('combobox')).toBeFocused();
      await page.keyboard.type('case study');
      await expect(palette.getByRole('option', { name: /^Ordered directory fixture/ })).toBeVisible();
      await expect(palette.locator('mark').first()).toBeVisible();
      // The long unbroken title and excerpt wrap inside the panel.
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const results = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
