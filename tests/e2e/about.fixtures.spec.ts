import { expect, test, type Page } from '@playwright/test';
import { headMetadata } from '../support/seo.ts';

// The fixture About entry in tests/fixtures/content/about (ADR-0004).

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

const portraitAlt = 'A tall gray placeholder ridgeline standing in for the portrait.';

test.describe('the About opener', () => {
  test('pairs “More than an engineer.” and the entry’s introduction with the portrait and its caption', async ({
    page,
  }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('More than an engineer.');
    await expect(page.getByRole('main')).toContainText('This is fixture text for the About opener.');
    const portrait = page.getByRole('figure').filter({ has: page.getByRole('img', { name: portraitAlt }) });
    await expect(portrait).toContainText('FIG. 01 / FIXTURE PORTRAIT');
    await expect(portrait).toContainText('Fixture caption for the portrait.');
    const image = portrait.getByRole('img');
    await expect(image).toHaveAttribute('width', /\d+/);
    await expect(image).toHaveAttribute('height', /\d+/);
  });

  test('from 768px the portrait sits beside the opener', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto('/about');
    const heading = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
    const image = (await page.getByRole('img', { name: portraitAlt }).boundingBox())!;
    expect(image.x).toBeGreaterThanOrEqual(heading.x + heading.width);
  });

  test('below 768px the portrait stacks below the opener', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/about');
    const intro = (await page.getByText('A second fixture paragraph').boundingBox())!;
    const image = (await page.getByRole('img', { name: portraitAlt }).boundingBox())!;
    expect(image.y).toBeGreaterThanOrEqual(intro.y + intro.height);
  });
});

test.describe('the career timeline', () => {
  test('lists the entry’s timeline in order under “Career”, each with its period, title and any detail', async ({
    page,
  }) => {
    await page.goto('/about');
    const career = page.getByRole('region', { name: 'Career' });
    await expect(career.getByRole('heading', { level: 2 })).toHaveText('Career');
    const entries = career.getByRole('listitem');
    await expect(entries.getByRole('heading', { level: 3 })).toHaveText([
      'First fixture timeline entry',
      'Second fixture timeline entry, with no detail',
      'Third fixture timeline entry',
    ]);
    await expect(entries.nth(0)).toContainText('Fixture period one');
    await expect(entries.nth(0)).toContainText('Fixture detail for the first timeline entry');
    await expect(entries.nth(1).locator('p')).toHaveText(['Fixture period two']);
  });

  test('from 768px each period sits beside its title', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto('/about');
    const first = page.getByRole('region', { name: 'Career' }).getByRole('listitem').first();
    const period = (await first.getByText('Fixture period one').boundingBox())!;
    const title = (await first.getByRole('heading', { level: 3 }).boundingBox())!;
    expect(title.x).toBeGreaterThanOrEqual(period.x + period.width);
  });
});

const landscapeAlt = 'A wide gray placeholder ridgeline standing in for the heritage landscape.';

test.describe('the heritage section', () => {
  test('shows the entry’s heritage text under “Heritage” with the landscape as the next numbered figure', async ({
    page,
  }) => {
    await page.goto('/about');
    const heritage = page.getByRole('region', { name: 'Heritage' });
    await expect(heritage.getByRole('heading', { level: 2 })).toHaveText('Heritage');
    await expect(heritage).toContainText('First fixture paragraph for the heritage section.');
    await expect(heritage).toContainText('Second fixture paragraph for the heritage section.');
    const figure = heritage.getByRole('figure');
    await expect(figure.getByRole('img', { name: landscapeAlt })).toHaveAttribute('width', /\d+/);
    await expect(figure).toContainText('FIG. 02 / FIXTURE LANDSCAPE');
    await expect(figure).toContainText('Fixture caption for the landscape.');
  });

  test('from 1024px the landscape sits beside the heritage text', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/about');
    const heritage = page.getByRole('region', { name: 'Heritage' });
    const text = (await heritage.getByText('Second fixture paragraph').boundingBox())!;
    const image = (await heritage.getByRole('img').boundingBox())!;
    expect(image.x).toBeGreaterThanOrEqual(text.x + text.width);
  });

  test('below 768px the landscape stacks below the heritage text', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/about');
    const heritage = page.getByRole('region', { name: 'Heritage' });
    const text = (await heritage.getByText('Second fixture paragraph').boundingBox())!;
    const image = (await heritage.getByRole('img').boundingBox())!;
    expect(image.y).toBeGreaterThanOrEqual(text.y + text.height);
  });
});

test.describe('the interests', () => {
  const interestAlt = 'A gray placeholder ridgeline standing in for an interest photo.';

  test('list each of the entry’s interests under “Interests”, with a photo tile only where one is given', async ({
    page,
  }) => {
    await page.goto('/about');
    const interests = page.getByRole('region', { name: 'Interests' });
    await expect(interests.getByRole('heading', { level: 2 })).toHaveText('Interests');
    const tiles = interests.getByRole('listitem');
    await expect(tiles.getByRole('heading', { level: 3 })).toHaveText([
      'First fixture interest',
      'Second fixture interest, with no photo',
      'Third fixture interest, with no photo or detail',
    ]);
    const photo = tiles.nth(0).getByRole('img', { name: interestAlt });
    await expect(photo).toHaveAttribute('width', /\d+/);
    await expect(photo).toHaveAttribute('height', /\d+/);
    await expect(tiles.nth(0)).toContainText('Fixture detail for an interest with a photo tile.');
    await expect(tiles.nth(1).getByRole('img')).toHaveCount(0);
    await expect(tiles.nth(2).getByRole('img')).toHaveCount(0);
    await expect(tiles.nth(2).locator('p')).toHaveCount(0);
  });

  test('from 1024px the tiles sit side by side', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/about');
    const tiles = page.getByRole('region', { name: 'Interests' }).getByRole('listitem');
    const first = (await tiles.nth(0).boundingBox())!;
    const second = (await tiles.nth(1).boundingBox())!;
    expect(second.x).toBeGreaterThanOrEqual(first.x + first.width);
  });

  test('below 768px the tiles stack', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/about');
    const tiles = page.getByRole('region', { name: 'Interests' }).getByRole('listitem');
    const first = (await tiles.nth(0).boundingBox())!;
    const second = (await tiles.nth(1).boundingBox())!;
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  });
});

// Site config has no contact or professional links in either build yet, so
// only the omitted invitation can be seen here; the unit tests for
// `contactInvitation` cover which links it offers once some are set.
test('the contact invitation is omitted while site config has no links, even though the entry has a sentence', async ({
  page,
}) => {
  await page.goto('/about');
  await expect(page.getByRole('region', { name: 'Get in touch' })).toHaveCount(0);
  await expect(page.getByText('Fixture invitation sentence')).toHaveCount(0);
});

test('sections follow the opener in order: career, heritage, interests', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([
    'Career',
    'Heritage',
    'Interests',
  ]);
});

test('the entry’s description becomes the page’s meta description', async ({ page }) => {
  await page.goto('/about');
  const meta = await headMetadata(page);
  expect(meta.description).toBe('Fixture description for the About page.');
});

// Review widths from design-spec §7.
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`/about never scrolls horizontally at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about');
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}
