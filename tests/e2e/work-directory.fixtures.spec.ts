import { expect, test, type Page } from '@playwright/test';
import { keepOnlyRow, longTitle, row } from '../support/work-directory.ts';

// Fixture projects in tests/fixtures/content/projects (ADR-0004).

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.describe('the work directory', () => {
  test('is titled “Things I’ve built” and marks Work as the current page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/work');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Things I’ve built');
    await expect(page).toHaveTitle('Work — Daniel Lee Holung');
    const work = page.getByRole('banner').getByRole('link', { name: 'Work', exact: true });
    await expect(work).toHaveAttribute('aria-current', 'page');
  });

  test('lists every published project, explicit order first, then newest year, never drafts', async ({ page }) => {
    await page.goto('/work');
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([
      longTitle,
      'Case study fixture',
      'No cover case study fixture',
      'Minimal case study fixture',
    ]);
    await expect(page.getByText('Draft case study fixture')).toHaveCount(0);
  });

  test('each row links its title to the case study and shows the summary, year, type, status and stack', async ({
    page,
  }) => {
    await page.goto('/work');
    const full = row(page, 'Case study fixture');
    await expect(full.getByRole('link', { name: 'Case study fixture' })).toHaveAttribute(
      'href',
      '/work/case-study-fixture',
    );
    await expect(full).toContainText('Test fixture that exercises every part of the case study template.');
    await expect(full.locator('dt')).toHaveText(['Year', 'Type', 'Status', 'Stack']);
    await expect(full.locator('dd')).toHaveText(['2026', 'Application', 'Maintained', 'Astro, TypeScript, MDX']);
  });

  test('a row shows the project thumbnail with its alt text and reserved dimensions', async ({ page }) => {
    await page.goto('/work');
    const thumbnail = row(page, 'Case study fixture').getByRole('img', {
      name: 'A gray placeholder ridgeline under a pale sky.',
    });
    await expect(thumbnail).toBeVisible();
    await expect(thumbnail).toHaveAttribute('width', /\d+/);
    await expect(thumbnail).toHaveAttribute('height', /\d+/);
  });

  test('the directory never shows a case study cover', async ({ page }) => {
    await page.goto('/work');
    await expect(
      page.getByRole('img', { name: 'A wide gray placeholder ridgeline, cropped for the case study.' }),
    ).toHaveCount(0);
  });

  test('a project without a thumbnail has no image, and its text lines up with rows that have one', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/work');
    const withoutThumbnail = row(page, longTitle);
    const withThumbnail = row(page, 'Case study fixture');
    await expect(withoutThumbnail.getByRole('img')).toHaveCount(0);

    const titleLeft = async (entry: typeof withThumbnail) =>
      (await entry.getByRole('heading', { level: 2 }).boundingBox())!.x;
    expect(await titleLeft(withoutThumbnail)).toBeCloseTo(await titleLeft(withThumbnail), 0);
  });

  test('rows are separated by thin rules, with a rule above the first and below the last', async ({ page }) => {
    await page.goto('/work');
    const rows = page.locator('.work-row');
    await expect(rows.first()).toHaveCSS('border-top-width', '1px');
    await expect(rows.nth(1)).toHaveCSS('border-top-width', '1px');
    await expect(rows.last()).toHaveCSS('border-bottom-width', '1px');
  });

  test('from 768px the thumbnail sits beside the text', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto('/work');
    const full = row(page, 'Case study fixture');
    const image = (await full.getByRole('img').boundingBox())!;
    const title = (await full.getByRole('heading', { level: 2 }).boundingBox())!;
    expect(title.x).toBeGreaterThanOrEqual(image.x + image.width);
  });

  test('below 768px each row stacks with the thumbnail above the text', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/work');
    const full = row(page, 'Case study fixture');
    const image = (await full.getByRole('img').boundingBox())!;
    const title = (await full.getByRole('heading', { level: 2 }).boundingBox())!;
    expect(title.y).toBeGreaterThanOrEqual(image.y + image.height);
  });
});

// Review widths from design-spec §7.
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`/work never scrolls horizontally and long titles and stacks wrap inside their row at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/work');
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    const long = row(page, longTitle);
    const rowBox = (await long.boundingBox())!;
    for (const part of [long.getByRole('heading', { level: 2 }), long.locator('dd').last()]) {
      const box = (await part.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(rowBox.x + rowBox.width + 0.5);
    }
  });
}

test.describe('the work directory with a single project', () => {
  for (const title of ['Case study fixture', longTitle]) {
    for (const width of [320, 768, 1440]) {
      test(`still reads as a finished catalogue with only “${title.slice(0, 30)}…” at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/work');
        await keepOnlyRow(page, title);
        const only = page.locator('.work-row');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Things I’ve built');
        await expect(only).toHaveCSS('border-top-width', '1px');
        await expect(only).toHaveCSS('border-bottom-width', '1px');
        await expect(only.getByRole('link', { name: title })).toBeVisible();
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      });
    }
  }
});
