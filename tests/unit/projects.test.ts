import { test } from 'node:test';
import assert from 'node:assert/strict';
import { directoryOrder, relatedWriting } from '../../src/lib/projects.ts';

function article(id: string, published: string, project?: string) {
  return {
    id,
    data: { published: new Date(published), project: project === undefined ? undefined : { id: project } },
  };
}

test('lists only the articles that reference the project, newest first', () => {
  const related = relatedWriting('site', [
    article('first-log', '2026-02-01', 'site'),
    article('unrelated', '2026-03-01'),
    article('latest-log', '2026-05-12', 'site'),
    article('other-project', '2026-04-01', 'other'),
    article('middle-log', '2026-03-20', 'site'),
  ]);
  assert.deepEqual(
    related.map((entry) => entry.id),
    ['latest-log', 'middle-log', 'first-log'],
  );
});

test('a project no article references has no related writing', () => {
  assert.deepEqual(relatedWriting('site', [article('unrelated', '2026-03-01')]), []);
});

function project(id: string, year: number, order?: number, title = id) {
  return { id, data: { title, year, order } };
}

test('the directory lists projects with an explicit order first, lowest number first', () => {
  const ordered = directoryOrder([
    project('newest-unordered', 2026),
    project('second', 2020, 2),
    project('first', 2019, 1),
  ]);
  assert.deepEqual(
    ordered.map((entry) => entry.id),
    ['first', 'second', 'newest-unordered'],
  );
});

test('projects without an order follow, newest year first, then by title', () => {
  const ordered = directoryOrder([
    project('older', 2024),
    project('newer-b', 2026, undefined, 'Beta'),
    project('newer-a', 2026, undefined, 'Alpha'),
  ]);
  assert.deepEqual(
    ordered.map((entry) => entry.id),
    ['newer-a', 'newer-b', 'older'],
  );
});

test('projects sharing an order fall back to newest year first', () => {
  const ordered = directoryOrder([project('old', 2021, 1), project('new', 2025, 1)]);
  assert.deepEqual(
    ordered.map((entry) => entry.id),
    ['new', 'old'],
  );
});

test('ordering does not change the list it was given', () => {
  const input = [project('a', 2020), project('b', 2026)];
  directoryOrder(input);
  assert.deepEqual(
    input.map((entry) => entry.id),
    ['a', 'b'],
  );
});
