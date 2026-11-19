import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { keepOnlyRow, longTitle } from '../support/work-directory.ts';

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// The fixture projects (ADR-0004) as built, and trimmed to a single project with and without a thumbnail.
const catalogues = [
  { name: 'with several projects', single: undefined },
  { name: 'with a single project', single: 'Case study fixture' },
  { name: 'with a single project and no thumbnail', single: longTitle },
];

for (const { name, single } of catalogues) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [320, 1440]) {
      test(`the work directory ${name} has no WCAG 2.2 AA violations in the ${theme} theme at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: theme });
        await page.goto('/work');
        if (single !== undefined) await keepOnlyRow(page, single);
        await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
        const results = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
}
