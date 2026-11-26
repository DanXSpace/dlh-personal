import { expect, test, type Page } from '@playwright/test';

// The fixture homepage entry, projects, articles and Now entry (ADR-0004).

const longProjectTitle =
  'Ordered directory fixture with a deliberately long title and an UnbrokenWordLongerThanANarrowScreen for checking how rows wrap';
const longArticleTitle =
  'A much longer title fixture for checking how article headings and their metadata wrap on narrow screens';

function section(page: Page, name: string) {
  return page.getByRole('region', { name });
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.describe('the homepage sections', () => {
  test('follow the hero in order: Selected work, Recent writing, In the present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([
      '01 / Selected work',
      '02 / Recent writing',
      '03 / In the present',
    ]);
  });

  test('Selected work lists at most three featured projects in directory order, never drafts', async ({ page }) => {
    await page.goto('/');
    const work = section(page, 'Selected work');
    // Four published fixtures are featured; the fourth, “Minimal case study fixture”, is left out.
    await expect(work.getByRole('heading', { level: 3 })).toHaveText([
      longProjectTitle,
      'Case study fixture',
      'No cover case study fixture',
    ]);
    await expect(work.getByText('Draft case study fixture')).toHaveCount(0);
    await expect(work.getByRole('link', { name: 'Case study fixture', exact: true })).toHaveAttribute(
      'href',
      '/work/case-study-fixture',
    );
    await expect(work).toContainText('Test fixture that exercises every part of the case study template.');
    await expect(work.getByRole('link', { name: 'All work' })).toHaveAttribute('href', '/work');
  });

  test('a selected project shows its thumbnail only when it has one', async ({ page }) => {
    await page.goto('/');
    const work = section(page, 'Selected work');
    await expect(work.getByRole('img', { name: 'A gray placeholder ridgeline under a pale sky.' })).toHaveCount(1);
    await expect(work.locator('li', { hasText: longProjectTitle }).getByRole('img')).toHaveCount(0);
  });

  test('Recent writing lists the three newest published articles with their dates, never drafts', async ({
    page,
  }) => {
    await page.goto('/');
    const writing = section(page, 'Recent writing');
    await expect(writing.getByRole('heading', { level: 3 })).toHaveText([
      'MDX components fixture',
      'Article template fixture',
      longArticleTitle,
    ]);
    await expect(writing.getByText('Draft fixture')).toHaveCount(0);
    await expect(writing.getByRole('link', { name: 'MDX components fixture' })).toHaveAttribute(
      'href',
      '/writing/mdx-components-fixture',
    );
    await expect(writing.locator('time').first()).toHaveAttribute('datetime', '2026-05-20');
    await expect(writing.getByRole('link', { name: 'Writing archive' })).toHaveAttribute('href', '/writing');
  });

  test('Selected work and Recent writing open with their introductions', async ({ page }) => {
    await page.goto('/');
    await expect(section(page, 'Selected work')).toContainText('A collection of personal projects and software experiments.');
    await expect(section(page, 'Recent writing')).toContainText('Notes on software, technology, learning and life.');
  });

  test('In the present shows the Now summary and links to the Now page', async ({ page }) => {
    await page.goto('/');
    const present = section(page, 'In the present');
    await expect(present).toContainText("Fixture summary of the Now entry, for the homepage's In the present section.");
    await expect(present.getByRole('link', { name: 'What I’m doing now' })).toHaveAttribute('href', '/now');
  });
});

// Review widths from design-spec §7.
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`the homepage never scrolls horizontally and long titles wrap inside their rows at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    for (const title of [longProjectTitle, longArticleTitle]) {
      const row = page.locator('main li', { hasText: title });
      const rowBox = (await row.boundingBox())!;
      const heading = (await row.getByRole('heading', { level: 3 }).boundingBox())!;
      expect(heading.x + heading.width).toBeLessThanOrEqual(rowBox.x + rowBox.width + 0.5);
    }
  });
}

test.describe('the homepage hero', () => {
  test('shows the full-name wordmark, the title in mono and the introduction from content', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.hero');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Daniel Lee Holung.');
    await expect(hero.locator('.hero-role')).toHaveText('Data Engineer, FinTech');
    await expect(hero.locator('.hero-role')).toHaveCSS('font-family', /Geist Mono/);
    await expect(hero).toContainText('Fixture introduction for the homepage hero.');
  });

  test('shows the landscape image with a figure caption', async ({ page }) => {
    await page.goto('/');
    const figure = page.locator('.hero figure');
    await expect(figure.getByRole('img')).toHaveAccessibleName(/cove in Jamaica/);
    await expect(figure.locator('figcaption')).toContainText('FIG. 01 / ROOTS');
  });

  test('loads the image eagerly at high priority with its dimensions reserved', async ({ page }) => {
    await page.goto('/');
    const image = page.locator('.hero figure img');
    await expect(image).toHaveAttribute('loading', 'eager');
    await expect(image).toHaveAttribute('fetchpriority', 'high');
    await expect(image).toHaveAttribute('width', /\d+/);
    await expect(image).toHaveAttribute('height', /\d+/);
    await expect(image).toHaveAttribute('srcset', /\d+w/);
  });

  test('a preview image is marked for the launch gate and labelled as a preview in its caption', async ({ page }) => {
    await page.goto('/');
    const figure = page.locator('.hero figure');
    test.skip((await figure.getAttribute('data-preview-asset')) === null, 'the hero has its licensed image');
    await expect(figure.locator('figcaption')).toContainText('Preview image');
    await expect(figure.getByRole('img')).toHaveAccessibleName(/^Preview image/);
  });

  test('from 1024px the copy takes seven columns and the image five, side by side', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const copy = (await page.locator('.hero-copy').boundingBox())!;
    const figure = (await page.locator('.hero figure').boundingBox())!;
    expect(figure.x).toBeGreaterThan(copy.x + copy.width);
    // Seven and five columns with equal gaps: the copy is about 7/5 the image's width.
    expect(copy.width / figure.width).toBeGreaterThan(1.3);
    expect(copy.width / figure.width).toBeLessThan(1.5);
  });

  for (const width of [320, 390, 768]) {
    test(`below 1024px the copy and actions stack before the image and caption at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const actions = (await page.locator('.hero-actions').boundingBox())!;
      const image = (await page.locator('.hero figure img').boundingBox())!;
      const caption = (await page.locator('.hero figcaption').boundingBox())!;
      expect(image.y).toBeGreaterThanOrEqual(actions.y + actions.height);
      expect(caption.y).toBeGreaterThanOrEqual(image.y + image.height);
    });
  }

  for (const width of [320, 1440]) {
    test(`the image keeps its focal point in view when cropped at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const image = page.locator('.hero figure img');
      await expect(image).toHaveCSS('object-fit', 'cover');
      await expect(image).toHaveCSS('object-position', '75% 60%');
    });
  }

  test('offers “Explore my work” first, then GitHub and the résumé once its PDF is hosted', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('.hero-actions a');
    // The fixture build hosts a résumé PDF and has published projects; site config sets a GitHub URL.
    await expect(links).toHaveText(['Explore my work', 'GitHub', 'Résumé']);
    await expect(links.first()).toHaveAttribute('href', '/work');
    await expect(links.last()).toHaveAttribute('href', '/resume');
  });
});
