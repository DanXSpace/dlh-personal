import { expect, test, type Page } from '@playwright/test';
import { indexedPages, publishedEntries } from '../support/search.ts';

// Full-text search (ticket 17) against the fixture build's Pagefind index
// (ADR-0004). The fixture build is a production build, so drafts are left out
// as they would be on the live site.

test.use({ viewport: { width: 1440, height: 900 } });

const palette = (page: Page) => page.getByRole('dialog', { name: 'Search' });

async function openPalette(page: Page) {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(palette(page).getByRole('combobox')).toBeFocused();
}

test('words from an article’s body find it, titled, with a short excerpt', async ({ page }) => {
  await openPalette(page);
  await page.keyboard.type('hanging indent');
  const result = palette(page).getByRole('option', { name: /^Article template fixture/ });
  await expect(result).toHaveAttribute('href', '/writing/article-template-fixture');
  await expect(result).toContainText('Writing');
  await expect(result.locator('.palette-option-excerpt')).toContainText('hanging indent');
});

test('only the title, deck or summary and body are searched, not the site header and footer, bylines, project details or heading links', async ({
  page,
}) => {
  await openPalette(page);
  const options = palette(page).getByRole('option');
  const status = palette(page).getByRole('status');

  // The theme selector's first option, in the site header.
  await page.keyboard.type('System');
  await expect(status).toHaveText('No matches');
  // In the site footer and every article's byline.
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Holung');
  await expect(status).toHaveText('No matches');
  // The minimal case study's type, shown only in its project details.
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Experiment');
  await expect(status).toHaveText('No matches');

  // Each heading's link is named "Link to this section: <heading>".
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('only section');
  const result = options.filter({ hasText: /^A much longer title fixture/ });
  await expect(result.locator('.palette-option-excerpt')).toContainText('Only section');
  await expect(result.locator('.palette-option-excerpt')).not.toContainText(/Link to this section|#/);
});

/** Holds Pagefind's files until `release` is called, so a test can act while search is still loading. */
async function holdPagefind(page: Page): Promise<() => void> {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/pagefind/**', async (route) => {
    await released;
    await route.continue();
  });
  return release;
}

test('while full-text search is loading, the list is marked busy and an empty list says so', async ({ page }) => {
  const release = await holdPagefind(page);
  await openPalette(page);
  // An empty list is hidden, so it is found by name with hidden elements included.
  const listbox = palette(page).getByRole('listbox', { name: 'Results', includeHidden: true });
  const status = palette(page).getByRole('status');

  await page.keyboard.type('hanging indent');
  await expect(status).toHaveText('Searching…');
  await expect(listbox).toHaveAttribute('aria-busy', 'true');

  release();
  await expect(status).toHaveText('1 result');
  await expect(listbox).toHaveAttribute('aria-busy', 'false');
});

test('full-text results join the list without moving the active option, and the keyboard reaches them', async ({
  page,
}) => {
  const release = await holdPagefind(page);
  await openPalette(page);
  const option = (name: string) => palette(page).getByRole('option', { name: new RegExp(`^${name}`) });

  await page.keyboard.type('case study');
  await expect(palette(page).getByRole('option')).toHaveText([
    /^Case study fixture/,
    /^No cover case study fixture/,
    /^Minimal case study fixture/,
  ]);
  await page.keyboard.press('ArrowDown');
  await expect(option('No cover case study fixture')).toHaveAttribute('aria-selected', 'true');

  // The ordered-directory fixture's title lacks "case study"; only its body has it.
  release();
  await expect(option('Ordered directory fixture')).toBeVisible();
  await expect(palette(page).getByRole('status')).toHaveText('4 results');
  await expect(option('No cover case study fixture')).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(option('Ordered directory fixture')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/work/ordered-directory-fixture-with-a-deliberately-long-title');
});

test('the index holds one page per published article and project, and no drafts or other pages', async ({ request }) => {
  const published = await publishedEntries(request);
  expect(published).toBeGreaterThan(0);
  expect(await indexedPages(request)).toBe(published);
});

test('drafts are never found', async ({ page }) => {
  await openPalette(page);
  // Only the draft fixtures' bodies use this word.
  await page.keyboard.type('reachable');
  await expect(palette(page).getByRole('status')).toHaveText('No matches');
});

/** Content Security Policy violations and console errors or warnings, from the start of the test. */
function recordProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  return problems;
}

test('search runs within the Content Security Policy, in Pagefind’s worker', async ({ page }) => {
  const problems = recordProblems(page);
  const worker = page.waitForEvent('worker');
  await openPalette(page);
  await page.keyboard.type('hanging indent');
  await expect(palette(page).getByRole('option', { name: /^Article template fixture/ })).toBeVisible();
  expect(new URL((await worker).url()).pathname).toBe('/pagefind/pagefind-worker.js');
  expect(problems).toEqual([]);
});

// Pagefind falls back to running on the main thread when its worker can't
// start, but compiling WebAssembly there needs 'wasm-unsafe-eval', which the
// policy doesn't allow (left for the owner to decide). Full-text matches are
// then missing, and the title matches still work.
test('if Pagefind can’t run, the palette still lists title matches', async ({ page }) => {
  await page.route('**/pagefind/pagefind-worker.js', (route) => route.abort());
  await openPalette(page);
  await page.keyboard.type('article template');
  await expect(palette(page).getByRole('option')).toHaveText([/^Article template fixture/]);
  await expect(palette(page).getByRole('status')).toHaveText('1 result');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/writing/article-template-fixture');
});
