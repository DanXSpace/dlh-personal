import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Fixture projects (ADR-0004): every part of the template, and only the required fields.
const caseStudies = [
  { name: 'the full case study fixture', path: '/work/case-study-fixture' },
  { name: 'the minimal case study fixture', path: '/work/minimal-case-study-fixture' },
];

for (const { name, path } of caseStudies) {
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
