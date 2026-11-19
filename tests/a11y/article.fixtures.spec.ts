import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Fixture articles (ADR-0004): every element, a long title with no contents, a contents opt-in, and every MDX content component.
const articles = [
  { name: 'the full article fixture', path: '/writing/article-template-fixture' },
  {
    name: 'the long-title fixture',
    path: '/writing/a-much-longer-title-fixture-for-checking-how-article-headings-wrap',
  },
  { name: 'the contents opt-in fixture', path: '/writing/contents-opt-in-fixture' },
  { name: 'the MDX components fixture', path: '/writing/mdx-components-fixture' },
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

// Closed disclosures hide their content from axe, so check the diagram text descriptions open too.
for (const theme of ['light', 'dark'] as const) {
  test(`the MDX diagram text descriptions have no WCAG 2.2 AA violations when open in the ${theme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/writing/mdx-components-fixture');
    for (const summary of await page.locator('.diagram summary').all()) await summary.click();
    await expect(page.locator('.diagram details[open]')).toHaveCount(2);
    const results = await new AxeBuilder({ page }).include('.diagram').withTags(wcagAA).analyze();
    expect(results.violations).toEqual([]);
  });
}
