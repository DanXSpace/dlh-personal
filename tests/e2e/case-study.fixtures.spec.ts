import { expect, test } from '@playwright/test';

// Fixture projects in tests/fixtures/content/projects (ADR-0004).
const full = '/work/case-study-fixture';
const minimal = '/work/minimal-case-study-fixture';
const noCover = '/work/no-cover-case-study-fixture';

test.describe('case study header', () => {
  test('shows Back to Work, the case-study label, title, summary and project metadata', async ({ page }) => {
    await page.goto(full);
    const header = page.getByRole('article').locator('header');
    await expect(header.getByRole('link', { name: 'Back to Work' })).toHaveAttribute('href', '/work');
    await expect(header).toContainText('Case study');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Case study fixture');
    await expect(header).toContainText('Test fixture that exercises every part of the case study template.');

    const metadata = header.locator('dl');
    await expect(metadata.locator('dt')).toHaveText(['Type', 'Year', 'Status', 'Stack']);
    await expect(metadata.locator('dd')).toHaveText(['Application', '2026', 'Maintained', 'Astro, TypeScript, MDX']);
  });

  test('the page title names the project', async ({ page }) => {
    await page.goto(full);
    await expect(page).toHaveTitle('Case study fixture — Daniel Lee Holung');
  });

  test('a deck replaces the summary under the title, and a metaTitle replaces the whole title', async ({ page }) => {
    await page.goto(noCover);
    const header = page.getByRole('article').locator('header');
    await expect(header).toContainText('Fixture deck that stands in for the summary under the title.');
    await expect(header).not.toContainText('Test fixture with several sections and no cover image.');
    await expect(page).toHaveTitle('No cover fixture — Full title override');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'No cover fixture — Full title override',
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Test fixture with several sections and no cover image.',
    );
  });

  test('Work is the active parent section, without aria-current', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(full);
    const work = page.getByRole('banner').getByRole('link', { name: 'Work', exact: true });
    await expect(work).not.toHaveAttribute('aria-current');
    await expect(work).toHaveCSS('text-decoration-line', 'underline');
  });
});

test.describe('wide image', () => {
  test('shows the cover with its alt text at the content shell width, wider than the reading column', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(full);
    const image = page.getByRole('img', { name: 'A wide gray placeholder ridgeline, cropped for the case study.' });
    await expect(image).toBeVisible();
    const { width } = (await image.boundingBox())!;
    expect(width).toBeGreaterThan(680);
    expect(width).toBeLessThanOrEqual(1040);
    // Width and height are reserved, so the page doesn't shift as it loads.
    await expect(image).toHaveAttribute('width', /\d+/);
    await expect(image).toHaveAttribute('height', /\d+/);
  });

  test('the directory thumbnail is not shown on the case study', async ({ page }) => {
    await page.goto(full);
    await expect(page.getByRole('img', { name: 'A gray placeholder ridgeline under a pale sky.' })).toHaveCount(0);
  });

  test('a case study without a cover has no wide image', async ({ page }) => {
    await page.goto(minimal);
    await expect(page.locator('.case-study-image')).toHaveCount(0);
    await expect(page.getByRole('img', { name: 'A darker gray placeholder ridgeline.' })).toHaveCount(0);
  });
});

test('a minimal case study shows its required metadata', async ({ page }) => {
  await page.goto(minimal);
  await expect(page.getByRole('article').locator('header dl dd')).toHaveText(['Experiment', '2025', 'Archived', 'HTML']);
});

test.describe('project links', () => {
  test('link to the repository and the live product when provided', async ({ page }) => {
    await page.goto(full);
    const header = page.getByRole('article').locator('header');
    await expect(header.getByRole('link', { name: 'Repository' })).toHaveAttribute(
      'href',
      'https://example.com/fixture/repository',
    );
    await expect(header.getByRole('link', { name: 'Live product' })).toHaveAttribute('href', 'https://example.com/fixture');
  });

  test('are left out when the project has none', async ({ page }) => {
    await page.goto(minimal);
    const header = page.getByRole('article').locator('header');
    await expect(header.getByRole('link', { name: 'Repository' })).toHaveCount(0);
    await expect(header.getByRole('link', { name: 'Live product' })).toHaveCount(0);
    await expect(header.getByRole('link')).toHaveText(['Back to Work']);
  });
});

test.describe('body', () => {
  test('uses the 680px reading column and renders the MDX content components', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(full);
    const prose = page.locator('.prose');
    expect((await prose.boundingBox())!.width).toBeLessThanOrEqual(680);
    await expect(prose.locator('> p').first()).toHaveCSS('font-size', '18px');
    await expect(prose.getByRole('img', { name: 'Diagram of two placeholder boxes joined by a line.' })).toBeVisible();
    await expect(prose).toContainText('FIG. 01 / FLOW');
    await expect(prose).toContainText('A callout inside a case study sets an aside apart from the prose.');
    await expect(page.getByRole('region', { name: 'Code: TypeScript' })).toBeVisible();
  });
});

test.describe('contents', () => {
  test('lists the case study sections as anchored links, with h3s nested', async ({ page }) => {
    await page.goto(full);
    const contents = page.getByRole('navigation', { name: 'Contents' });
    await expect(contents.locator(':scope > ol > li > a')).toHaveText(['Problem', 'Architecture', 'Lessons']);
    await expect(contents.locator('ol ol a')).toHaveText(['Decisions and trade-offs']);

    await contents.getByRole('link', { name: 'Lessons' }).click();
    await expect(page).toHaveURL(/#lessons$/);
    await expect(page.locator('#lessons')).toBeInViewport();
  });

  test('a case study with a single section has no contents', async ({ page }) => {
    await page.goto(minimal);
    await expect(page.getByRole('navigation', { name: 'Contents' })).toHaveCount(0);
  });

  test('at 1024px and up the contents sit beside the reading column', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(full);
    const contents = await page.getByRole('navigation', { name: 'Contents' }).boundingBox();
    const prose = await page.locator('.prose').boundingBox();
    expect(contents!.x).toBeGreaterThanOrEqual(prose!.x + prose!.width);
  });

  test('without a cover, the contents and body still start side by side below the header', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(noCover);
    const header = await page.getByRole('article').locator('header').boundingBox();
    const contents = await page.getByRole('navigation', { name: 'Contents' }).boundingBox();
    const prose = await page.locator('.prose').boundingBox();
    expect(contents!.x).toBeGreaterThanOrEqual(prose!.x + prose!.width);
    expect(Math.abs(contents!.y - prose!.y)).toBeLessThanOrEqual(1);
    // One 48px row gap below the header, not an empty row where the cover would be.
    expect(prose!.y - (header!.y + header!.height)).toBeLessThanOrEqual(49);
  });

  test('below 1024px the contents come before the body', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto(full);
    const contents = await page.getByRole('navigation', { name: 'Contents' }).boundingBox();
    const prose = await page.locator('.prose').boundingBox();
    expect(contents!.y + contents!.height).toBeLessThanOrEqual(prose!.y);
  });
});

test.describe('related writing', () => {
  test('lists the published articles that reference the project, newest first, without drafts', async ({ page }) => {
    await page.goto(full);
    const related = page.getByRole('region', { name: 'Related writing' });
    await expect(related.getByRole('link')).toHaveText(['Article template fixture', 'Earlier year fixture']);
    await expect(related.getByRole('link', { name: 'Article template fixture' })).toHaveAttribute(
      'href',
      '/writing/article-template-fixture',
    );
    await expect(related.locator('time[datetime="2026-03-14"]')).toHaveText('March 14, 2026');
    await expect(related).not.toContainText('Draft fixture');
  });

  test('is left out when no article references the project', async ({ page }) => {
    await page.goto(minimal);
    await expect(page.getByRole('region', { name: 'Related writing' })).toHaveCount(0);
    await expect(page.getByText('Related writing')).toHaveCount(0);
  });
});

// The fixture build is a production build (`import.meta.env.PROD`), so it applies the draft rule.
test('a draft project is absent from the built site', async ({ page }) => {
  const response = await page.goto('/work/draft-case-study-fixture');
  expect(response?.status()).toBe(404);
});

// Widths from docs/design-spec.md §7; the wide image and the two-column grid from 1024px make every one matter.
for (const width of [320, 390, 768, 1024, 1440]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const path of [full, minimal, noCover]) {
      test(`${path} never scrolls horizontally`, async ({ page }) => {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  });
}
