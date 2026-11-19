import { expect, test } from '@playwright/test';

// The fixture Now entry in tests/fixtures/content/now/index.md (ADR-0004).

test.describe('the Now page', () => {
  test('is titled “In the present” and marks Now as the current page', async ({ page }) => {
    await page.goto('/now');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('In the present');
    await expect(page).toHaveTitle('Now — Daniel Lee Holung');
    const now = page.getByRole('banner').getByRole('link', { name: 'Now', exact: true });
    await expect(now).toHaveAttribute('aria-current', 'page');
  });

  test('shows when the snapshot was last updated, as a machine-readable date', async ({ page }) => {
    await page.goto('/now');
    const updated = page.getByRole('main').getByText('Last updated November 19, 2026');
    await expect(updated).toBeVisible();
    await expect(updated.locator('time')).toHaveAttribute('datetime', '2026-11-19');
  });

  test('opens with the introduction, before any section', async ({ page }) => {
    await page.goto('/now');
    const intro = page.getByText('Fixture introduction to the Now page.');
    await expect(intro).toBeVisible();
    const firstSection = (await page.getByRole('heading', { level: 2 }).first().boundingBox())!;
    expect((await intro.boundingBox())!.y).toBeLessThan(firstSection.y);
  });

  test('renders the sections the entry has, in its order, and none it leaves out', async ({ page }) => {
    await page.goto('/now');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 2 })).toHaveText(['Building', 'Learning', 'Listening']);
    await expect(main.getByText('First fixture item')).toBeVisible();
    for (const missing of ['Exploring', 'Training']) {
      await expect(main.getByRole('heading', { name: missing })).toHaveCount(0);
    }
  });
});

// Review widths from design-spec §7.
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`/now never scrolls horizontally and keeps its text in the reading column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/now');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    ).toBeLessThanOrEqual(0);
    const intro = (await page.getByText('Fixture introduction to the Now page.').boundingBox())!;
    expect(intro.width).toBeLessThanOrEqual(680);
  });
}
