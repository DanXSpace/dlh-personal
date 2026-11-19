import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const pages = [
  { name: 'homepage', path: '/' },
  { name: '404 page', path: '/this-page-does-not-exist' },
];

for (const { name, path } of pages) {
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

for (const theme of ['light', 'dark'] as const) {
  test(`the open mobile menu has no WCAG 2.2 AA violations in the ${theme} theme`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
    expect(results.violations).toEqual([]);
  });
}
