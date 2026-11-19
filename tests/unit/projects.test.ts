import { test } from 'node:test';
import assert from 'node:assert/strict';
import { relatedWriting } from '../../src/lib/projects.ts';

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
