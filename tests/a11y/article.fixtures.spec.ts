import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Fixture articles (ADR-0004): every element, a long title with no contents, and a contents opt-in.
const articles = [
  { name: 'the full article fixture', path: '/writing/article-template-fixture' },
  {
    name: 'the long-title fixture',
    path: '/writing/a-much-longer-title-fixture-for-checking-how-article-headings-wrap',
  },
  { name: 'the contents opt-in fixture', path: '/writing/contents-opt-in-fixture' },
];

for (const { name, path } of articles) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [320, 1440]) {
      test(`${name} has no WCAG 2.2 AA violations in the ${theme} theme at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(path);
        await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
        const results = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
}
