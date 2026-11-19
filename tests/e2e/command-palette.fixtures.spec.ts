import { expect, test } from '@playwright/test';

// Fixture content in tests/fixtures/content (ADR-0004). The fixture build is a
// production build, so drafts are left out as they would be on the live site.

test.use({ viewport: { width: 1440, height: 900 } });

test('the palette lists published articles and projects, never drafts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('banner').getByRole('button', { name: 'Search' }).click();
  const palette = page.getByRole('dialog', { name: 'Search' });
  const option = (name: string, kind: string) => palette.getByRole('option', { name: `${name} ${kind}`, exact: true });

  await expect(option('Article template fixture', 'Writing')).toHaveAttribute('href', '/writing/article-template-fixture');
  await expect(option('Earlier year fixture', 'Writing')).toBeAttached();
  await expect(option('Case study fixture', 'Work')).toHaveAttribute('href', '/work/case-study-fixture');
  await expect(option('Minimal case study fixture', 'Work')).toBeAttached();
  await expect(palette.getByRole('option', { name: /Draft/ })).toHaveCount(0);
});

test('with the résumé PDF hosted, the palette lists the Résumé page after the primary pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('banner').getByRole('button', { name: 'Search' }).click();
  const pages = page.getByRole('dialog', { name: 'Search' }).getByRole('option', { name: / Page$/ });
  await expect(pages).toHaveText([/^Home/, /^About/, /^Work/, /^Writing/, /^Now/, /^Résumé/]);
  await expect(pages.last()).toHaveAttribute('href', '/resume');
});

test('typing narrows the list to matching articles and projects, and Enter opens the match', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Search' });
  await expect(palette.getByRole('combobox')).toBeFocused();

  await page.keyboard.type('case study minimal');
  await expect(palette.getByRole('option')).toHaveText([/^Minimal case study fixture/]);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/work/minimal-case-study-fixture');
});
