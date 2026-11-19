import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navState } from '../../src/lib/nav.ts';

test('a link to the current page is the exact page', () => {
  assert.equal(navState('/about', '/about'), 'page');
});

test('detail and category pages mark their parent section, not the exact page', () => {
  assert.equal(navState('/work/quiet-precision', '/work'), 'section');
  assert.equal(navState('/writing/category/engineering', '/writing'), 'section');
});

test('a path that only shares a prefix is not in the section', () => {
  assert.equal(navState('/workshop', '/work'), 'none');
  assert.equal(navState('/nowhere', '/now'), 'none');
});

test('home is the exact page only on the homepage, never a parent section', () => {
  assert.equal(navState('/', '/'), 'page');
  assert.equal(navState('/about', '/'), 'none');
  assert.equal(navState('/work/quiet-precision', '/'), 'none');
});

test('trailing slashes on the current path or the link do not change the state', () => {
  assert.equal(navState('/about/', '/about'), 'page');
  assert.equal(navState('/about', '/about/'), 'page');
  assert.equal(navState('/work/quiet-precision/', '/work/'), 'section');
});
