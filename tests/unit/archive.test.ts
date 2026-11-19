import { test } from 'node:test';
import assert from 'node:assert/strict';
import { archiveByYear, categoriesWithArticles, newestFirst } from '../../src/lib/archive.ts';

function article(id: string, published: string) {
  return { id, data: { published: new Date(published) } };
}

test('groups articles by publication year, newest year first and newest article first within a year', () => {
  const archive = archiveByYear([
    article('spring-2025', '2025-04-10'),
    article('winter-2026', '2026-01-05'),
    article('autumn-2024', '2024-10-01'),
    article('summer-2026', '2026-07-21'),
    article('december-2025', '2025-12-31'),
  ]);

  assert.deepEqual(
    archive.map(({ year, articles }) => [year, articles.map((entry) => entry.id)]),
    [
      [2026, ['summer-2026', 'winter-2026']],
      [2025, ['december-2025', 'spring-2025']],
      [2024, ['autumn-2024']],
    ],
  );
});

test('no articles means no years', () => {
  assert.deepEqual(archiveByYear([]), []);
});

test('newest first sorts a copy by publication date, leaving the original order alone', () => {
  const articles = [article('middle', '2025-06-01'), article('newest', '2026-02-10'), article('oldest', '2024-09-15')];
  assert.deepEqual(
    newestFirst(articles).map((entry) => entry.id),
    ['newest', 'middle', 'oldest'],
  );
  assert.deepEqual(
    articles.map((entry) => entry.id),
    ['middle', 'newest', 'oldest'],
  );
});

test('an article published on January 1 belongs to that year on a build machine behind UTC', (t) => {
  const zone = process.env['TZ'];
  t.after(() => {
    if (zone === undefined) delete process.env['TZ'];
    else process.env['TZ'] = zone;
  });
  process.env['TZ'] = 'America/Jamaica';

  const archive = archiveByYear([article('new-year', '2026-01-01')]);
  assert.equal(archive[0]?.year, 2026);
});

test('lists only categories that have articles, in the canonical category order', () => {
  const categories = categoriesWithArticles([
    { data: { category: 'life' } },
    { data: { category: 'engineering' } },
    { data: { category: 'life' } },
    { data: { category: 'learning' } },
  ]);
  assert.deepEqual(categories, ['engineering', 'learning', 'life']);
});

test('no articles means no categories', () => {
  assert.deepEqual(categoriesWithArticles([]), []);
});
