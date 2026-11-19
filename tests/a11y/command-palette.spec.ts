import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Rule tags covering WCAG 2.0–2.2 levels A and AA.
const wcagAA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function openPalette(page: Page, width: number) {
  if (width < 768) await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('banner').getByRole('button', { name: 'Search' }).click();
  const palette = page.getByRole('dialog', { name: 'Search' });
  await expect(palette.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  return palette;
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [320, 1440]) {
    test(`the open palette has no WCAG 2.2 AA violations in the ${theme} theme at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/');
      await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
      await openPalette(page, width);
      const results = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test(`with no matches the palette has no WCAG 2.2 AA violations in the ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    const palette = await openPalette(page, 1440);
    await page.keyboard.type('zzz');
    await expect(palette.getByRole('status')).toHaveText('No matches');
    const results = await new AxeBuilder({ page }).withTags(wcagAA).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('the palette follows the theme: its panel and backdrop take the page background', async ({ page }) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    const palette = await openPalette(page, 1440);
    const pageBackground = await page.locator('html').evaluate((html) => getComputedStyle(html).backgroundColor);
    await expect(palette).toHaveCSS('background-color', pageBackground);
    // The backdrop is the page background, partly transparent.
    const backdrop = await palette.evaluate((dialog) => getComputedStyle(dialog, '::backdrop').backgroundColor);
    expect(backdrop).toMatch(/^(rgba|color)\(/);
    expect(backdrop).not.toBe(pageBackground);
  }
});

test('with reduced motion the palette and its controls do not animate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const palette = await openPalette(page, 1440);
  await expect(palette).toHaveCSS('animation-name', 'none');
  await expect(palette).toHaveCSS('transition-duration', '0s');
  await expect(palette.getByRole('button', { name: 'Close' })).toHaveCSS('transition-duration', '0s');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Search' })).toHaveCSS('transition-duration', '0s');
});
