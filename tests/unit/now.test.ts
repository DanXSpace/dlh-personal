import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nowSchema } from '../../src/lib/now.ts';

function issues(frontmatter: unknown) {
  const result = nowSchema.safeParse(frontmatter);
  assert.equal(result.success, false, 'expected the frontmatter to be rejected');
  return result.error!.issues.map(({ path, message }) => ({ path: path.join('.'), message }));
}

test('accepts an updated date and an optional summary', () => {
  const parsed = nowSchema.parse({ updated: '2026-11-19', summary: 'Building this site.' });
  assert.deepEqual(parsed, { updated: new Date('2026-11-19'), summary: 'Building this site.' });
  assert.deepEqual(nowSchema.parse({ updated: '2026-11-19' }), { updated: new Date('2026-11-19') });
});

test('a missing updated date is rejected with a message that says what to add', () => {
  const [issue] = issues({ summary: 'Building this site.' });
  assert.equal(issue?.path, 'updated');
  assert.match(issue!.message, /`updated`/);
  assert.match(issue!.message, /YYYY-MM-DD/);
});

test('an updated value that is not a date is rejected the same way', () => {
  const [issue] = issues({ updated: 'last week' });
  assert.equal(issue?.path, 'updated');
  assert.match(issue!.message, /YYYY-MM-DD/);
});

test('the summary, when given, is short and not blank', () => {
  assert.equal(issues({ updated: '2026-11-19', summary: '   ' })[0]?.path, 'summary');
  assert.equal(issues({ updated: '2026-11-19', summary: 'x'.repeat(161) })[0]?.path, 'summary');
});
