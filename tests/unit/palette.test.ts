import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createQueryRunner,
  filterEntries,
  paletteEntries,
  staticSource,
  type PaletteEntry,
  type ResultSource,
} from '../../src/lib/palette.ts';

const nav = [
  { label: 'About', href: '/about' },
  { label: 'Work', href: '/work' },
];

function article(id: string, title: string, published: string) {
  return { id, data: { title, published: new Date(published) } };
}

function project(id: string, title: string, year: number, order?: number) {
  return { id, data: { title, year, order } };
}

test('lists Home and the primary pages first, then articles newest first, then projects in directory order', () => {
  const entries = paletteEntries({
    nav,
    articles: [
      article('older', 'An older note', '2025-03-01'),
      article('newer', 'A newer note', '2026-06-01'),
    ],
    projects: [project('later', 'Later project', 2026), project('pinned', 'Pinned project', 2024, 1)],
  });
  assert.deepEqual(entries, [
    { title: 'Home', href: '/', kind: 'page' },
    { title: 'About', href: '/about', kind: 'page' },
    { title: 'Work', href: '/work', kind: 'page' },
    { title: 'A newer note', href: '/writing/newer', kind: 'article' },
    { title: 'An older note', href: '/writing/older', kind: 'article' },
    { title: 'Pinned project', href: '/work/pinned', kind: 'project' },
    { title: 'Later project', href: '/work/later', kind: 'project' },
  ]);
});

test('with no content yet, only the pages are listed', () => {
  assert.deepEqual(
    paletteEntries({ nav, articles: [], projects: [] }).map((entry) => entry.href),
    ['/', '/about', '/work'],
  );
});

const catalogue: PaletteEntry[] = [
  { title: 'Home', href: '/', kind: 'page' },
  { title: 'Writing', href: '/writing', kind: 'page' },
  { title: 'Notes on static sites', href: '/writing/static', kind: 'article' },
  { title: 'Résumé builder', href: '/work/resume', kind: 'project' },
  { title: 'Site search', href: '/work/search', kind: 'project' },
];

const titles = (entries: readonly PaletteEntry[]) => entries.map((entry) => entry.title);

test('an empty or blank query lists every entry', () => {
  assert.deepEqual(filterEntries(catalogue, ''), catalogue);
  assert.deepEqual(filterEntries(catalogue, '   '), catalogue);
});

test('a query matches titles anywhere, ignoring case, and keeps the listed order', () => {
  assert.deepEqual(titles(filterEntries(catalogue, 'SITE')), ['Notes on static sites', 'Site search']);
});

test('every word of the query must appear, in any order', () => {
  assert.deepEqual(titles(filterEntries(catalogue, 'sites notes')), ['Notes on static sites']);
  assert.deepEqual(titles(filterEntries(catalogue, 'site home')), []);
});

test('accents are optional when typing', () => {
  assert.deepEqual(titles(filterEntries(catalogue, 'resume')), ['Résumé builder']);
});

interface Pending {
  query: string;
  signal: AbortSignal;
  resolve: (entries: PaletteEntry[]) => void;
  reject: (error: Error) => void;
}

/** A source whose results arrive when the test settles them, like a search index loading. */
function deferredSource() {
  const pending: Pending[] = [];
  const source: ResultSource = {
    search: (query, signal) =>
      new Promise<PaletteEntry[]>((resolve, reject) => {
        pending.push({ query, signal, resolve, reject });
      }),
  };
  return { source, pending };
}

const page = (title: string): PaletteEntry => ({ title, href: `/${title.toLowerCase()}`, kind: 'page' });
const found = (title: string): PaletteEntry => ({ title, href: `/found/${title.toLowerCase()}`, kind: 'article' });

/** Lets settled promises run their callbacks. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('synchronous results show at once, and a slower source adds its results after them', async () => {
  const shown: string[][] = [];
  const slow = deferredSource();
  const run = createQueryRunner([staticSource([page('Home'), page('Writing')]), slow.source], (results) =>
    shown.push(titles(results)),
  );

  run('writ');
  assert.deepEqual(shown, [['Writing']]);
  assert.equal(slow.pending[0]!.query, 'writ');

  slow.pending[0]!.resolve([found('Written elsewhere')]);
  await settle();
  assert.deepEqual(shown, [['Writing'], ['Writing', 'Written elsewhere']]);
});

test('a newer query aborts the older one, and late results for the older query never show', async () => {
  const shown: string[][] = [];
  const slow = deferredSource();
  const run = createQueryRunner([slow.source], (results) => shown.push(titles(results)));

  run('st');
  run('static');
  const [older, newer] = slow.pending;
  assert.equal(older!.signal.aborted, true);
  assert.equal(newer!.signal.aborted, false);

  older!.resolve([found('Stale')]);
  newer!.resolve([found('Static')]);
  await settle();
  assert.deepEqual(shown, [[], [], ['Static']]);
});

test('a source that fails leaves the other results in place', async () => {
  const shown: string[][] = [];
  const failing = deferredSource();
  const run = createQueryRunner([staticSource([page('Home')]), failing.source], (results) =>
    shown.push(titles(results)),
  );

  run('');
  failing.pending[0]!.reject(new Error('index unavailable'));
  await settle();
  assert.deepEqual(shown, [['Home']]);
});
