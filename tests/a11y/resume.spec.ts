import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// The on-request state exists only while the production build has no résumé
// PDF; fixture tests cover the hosted PDF (ADR-0004).
for (const theme of ['light', 'dark'] as const) {
  for (const width of [320, 1440]) {
    test(`the résumé page on request has no WCAG 2.2 AA violations in the ${theme} theme at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/resume');
      const pdfLinks = await page.getByRole('main').locator('a[href="/resume.pdf"]').count();
      test.skip(pdfLinks > 0, 'the production build hosts the résumé PDF');
      await expect(page.getByText('My résumé is available on request.')).toBeVisible();
      await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
      const results = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
