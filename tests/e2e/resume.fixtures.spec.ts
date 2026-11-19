import { expect, test } from '@playwright/test';

// The fixture build hosts a placeholder PDF from tests/fixtures/public (ADR-0004).

test.describe('the résumé page with a hosted PDF', () => {
  for (const width of [320, 1440]) {
    test(`links to the PDF download, without overflow, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      expect((await page.goto('/resume'))?.status()).toBe(200);
      await expect(page).toHaveTitle('Résumé — Daniel Lee Holung');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Résumé');
      const download = page.getByRole('main').getByRole('link', { name: 'Download résumé (PDF)' });
      await expect(download).toHaveAttribute('href', '/resume.pdf');
      await expect(page.getByText(/available on request/)).toHaveCount(0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('serves the PDF it links to', async ({ request }) => {
    const response = await request.get('/resume.pdf');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('is linked from the footer on every page', async ({ page }) => {
    for (const path of ['/', '/work', '/resume']) {
      await page.goto(path);
      const link = page.getByRole('contentinfo').getByRole('link', { name: 'Résumé' });
      await expect(link).toHaveAttribute('href', '/resume');
    }
  });
});
