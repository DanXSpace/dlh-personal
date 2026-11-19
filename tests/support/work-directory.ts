import { expect, type Locator, type Page } from '@playwright/test';

/** The fixture project with an explicit order, no thumbnail and a long stack. */
export const longTitle =
  'Ordered directory fixture with a deliberately long title and an UnbrokenWordLongerThanANarrowScreen for checking how rows wrap';

/** The `/work` row whose title is exactly `title`. */
export function row(page: Page, title: string): Locator {
  return page.locator('.work-row').filter({
    has: page.getByRole('heading', { level: 2, name: title, exact: true }),
  });
}

/**
 * Removes every `/work` row except the one titled `title`, so browser and axe
 * tests can check the single-project catalogue against the fixture build,
 * which has several projects. Faithful only while the directory template has
 * no markup that depends on how many projects there are (owner decision,
 * ticket 10, 2026-11-19).
 */
export async function keepOnlyRow(page: Page, title: string) {
  await page.evaluate((keep) => {
    for (const entry of document.querySelectorAll('.work-row')) {
      if (entry.querySelector('h2')?.textContent?.trim() !== keep) entry.remove();
    }
  }, title);
  await expect(page.locator('.work-row')).toHaveCount(1);
}
