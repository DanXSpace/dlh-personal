import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pagefindSource, type Pagefind, type PagefindResultData } from '../../src/lib/search.ts';

/** A stand-in for Pagefind's browser API that answers every query with `pages`. */
function fakePagefind(pages: PagefindResultData[]): Pagefind & { queries: string[] } {
  const queries: string[] = [];
  return {
    queries,
    search: async (query) => {
      queries.push(query);
      return { results: pages.map((page) => ({ data: async () => page })) };
    },
  };
}

const signal = new AbortController().signal;

test('turns Pagefind results into titled entries with their excerpt, in the site’s link form', async () => {
  const pagefind = fakePagefind([
    { url: '/writing/first-note/', meta: { title: 'First note' }, excerpt: 'a <mark>hanging</mark> indent' },
    { url: '/work/a-project/', meta: { title: 'A project' }, excerpt: 'built a <mark>hanging</mark> garden' },
  ]);
  const source = pagefindSource(async () => pagefind);

  assert.deepEqual(await source.search('hanging', signal), [
    { title: 'First note', href: '/writing/first-note', kind: 'article', excerpt: 'a <mark>hanging</mark> indent' },
    { title: 'A project', href: '/work/a-project', kind: 'project', excerpt: 'built a <mark>hanging</mark> garden' },
  ]);
});

test('keeps the eight best matches, in Pagefind’s order', async () => {
  const pages = Array.from({ length: 12 }, (_, i) => ({
    url: `/writing/note-${i + 1}/`,
    meta: { title: `Note ${i + 1}` },
    excerpt: 'match',
  }));
  const source = pagefindSource(async () => fakePagefind(pages));

  const entries = await source.search('match', signal);
  assert.deepEqual(
    entries.map((entry) => entry.title),
    ['Note 1', 'Note 2', 'Note 3', 'Note 4', 'Note 5', 'Note 6', 'Note 7', 'Note 8'],
  );
});

test('a blank query finds nothing and doesn’t load Pagefind', async () => {
  let loads = 0;
  const source = pagefindSource(async () => {
    loads += 1;
    return fakePagefind([]);
  });

  assert.deepEqual(await source.search('', signal), []);
  assert.deepEqual(await source.search('   ', signal), []);
  assert.equal(loads, 0);
});

test('loads Pagefind once, on the first query, and tries again after a failed load', async () => {
  let loads = 0;
  const pagefind = fakePagefind([]);
  const source = pagefindSource(async () => {
    loads += 1;
    if (loads === 1) throw new Error('offline');
    return pagefind;
  });

  await assert.rejects(Promise.resolve(source.search('first', signal)));
  await source.search('second', signal);
  await source.search('third', signal);
  assert.equal(loads, 2);
  assert.deepEqual(pagefind.queries, ['second', 'third']);
});
