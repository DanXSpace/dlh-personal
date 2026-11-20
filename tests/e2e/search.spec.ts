import { expect, test, type Page } from '@playwright/test';
import { paletteTitles, resultCount } from '../support/palette.ts';
import { indexedPages, publishedEntries } from '../support/search.ts';

// Full-text search (ticket 17) in the production build, whose Pagefind index
// is built by `npm run build` from `src/content` only.

test.use({ viewport: { width: 1440, height: 900 } });

const palette = (page: Page) => page.getByRole('dialog', { name: 'Search' });

test('search loads only once the visitor types a query, and runs without errors', async ({ page, request }) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(palette(page).getByRole('status')).toHaveText(resultCount((await paletteTitles(request)).length));
  expect(requests.filter((path) => path.startsWith('/pagefind/'))).toEqual([]);

  await page.keyboard.type('now');
  await expect(palette(page).getByRole('status')).toHaveText('1 result');
  await expect(palette(page).getByRole('listbox')).toHaveAttribute('aria-busy', 'false');
  expect(requests.filter((path) => path.startsWith('/pagefind/')).length).toBeGreaterThan(0);
  // With nothing published, the index is empty and Pagefind's bundle isn't needed.
  if ((await indexedPages(request)) > 0) expect(requests).toContain('/pagefind/pagefind.js');
  expect(errors).toEqual([]);
});

test('the production index holds one page per published article and project', async ({ request }) => {
  expect(await indexedPages(request)).toBe(await publishedEntries(request));
});

test('the production index finds no fixture or draft content', async ({ page, request }) => {
  // Pagefind refuses to search an empty index, which is all it holds until there is content.
  test.skip((await indexedPages(request)) === 0, 'nothing is published yet');
  await page.goto('/');
  const found = await page.evaluate(async () => {
    const url = '/pagefind/pagefind.js';
    const pagefind = (await import(/* @vite-ignore */ url)) as {
      search(query: string): Promise<{ results: { data(): Promise<{ url: string }> }[] }>;
    };
    // Every fixture's slug has "fixture"; only the draft fixtures' bodies have "reachable".
    // Pagefind matches loosely ("fixture" also finds "fixed" in real copy), so check
    // which pages come back rather than how many.
    return Promise.all(
      ['fixture', 'reachable'].map(async (query) =>
        Promise.all((await pagefind.search(query)).results.map(async (result) => (await result.data()).url)),
      ),
    );
  });
  const [fixtureHits, draftHits] = found;
  expect(fixtureHits!.filter((url) => url.includes('fixture'))).toEqual([]);
  expect(draftHits).toEqual([]);
});
