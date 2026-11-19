import { expect, test, type Page } from '@playwright/test';

/**
 * The on-request state can only be seen in a build without `public/resume.pdf`,
 * which today is the production build. Fixture tests cover the hosted PDF
 * (ADR-0004); these skip themselves once the owner supplies the PDF.
 */
async function skipOncePdfIsHosted(page: Page) {
  const response = await page.goto('/resume');
  expect(response?.status()).toBe(200);
  const pdfLinks = await page.getByRole('main').locator('a[href="/resume.pdf"]').count();
  test.skip(pdfLinks > 0, 'the production build hosts the résumé PDF');
}

test.describe('the résumé page without a hosted PDF', () => {
  for (const width of [320, 1440]) {
    test(`says the résumé is available on request, without overflow, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await skipOncePdfIsHosted(page);
      await expect(page).toHaveTitle('Résumé — Daniel Lee Holung');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Résumé');
      await expect(page.getByText('My résumé is available on request.')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('offers no download, and no PDF is served', async ({ page, request }) => {
    await skipOncePdfIsHosted(page);
    await expect(page.getByRole('link', { name: /download/i })).toHaveCount(0);
    expect((await request.get('/resume.pdf')).status()).toBe(404);
  });

  test('is not linked from the footer', async ({ page }) => {
    await skipOncePdfIsHosted(page);
    for (const path of ['/', '/resume']) {
      await page.goto(path);
      await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Résumé' })).toHaveCount(0);
    }
  });
});
