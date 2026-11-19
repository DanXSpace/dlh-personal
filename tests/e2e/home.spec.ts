import { expect, test } from '@playwright/test';

// The production homepage before the owner's content exists (ticket 18).
// Fixture tests cover the homepage with content (ADR-0004).

test('without content the homepage is the hero alone, with no introduction, empty sections or dead links', async ({
  page,
}) => {
  await page.goto('/');
  const main = page.getByRole('main');
  test.skip((await main.getByRole('heading', { level: 2 }).count()) > 0, 'the production build has content');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Daniel Lee Holung');
  await expect(main).toContainText('Building things. Exploring ideas. Always learning.');
  await expect(main.locator('.hero-introduction')).toHaveCount(0);
  await expect(main.getByRole('region')).toHaveCount(0);
  // No projects, GitHub URL or résumé PDF yet, so no call to action has anywhere to go.
  await expect(main.getByRole('link')).toHaveCount(0);
  await expect(main.locator('.hero figure figcaption')).toContainText('FIG. 01 / ROOTS');
});
