import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isVisible } from '../../src/lib/drafts.ts';

const published = { data: { draft: false } };
const draft = { data: { draft: true } };

test('production builds show published entries and hide drafts', () => {
  assert.equal(isVisible(published, { production: true }), true);
  assert.equal(isVisible(draft, { production: true }), false);
});

test('the dev server shows drafts so authors can preview them', () => {
  assert.equal(isVisible(published, { production: false }), true);
  assert.equal(isVisible(draft, { production: false }), true);
});
