import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entryHref, entryKindOf, withoutTrailingSlash } from '../../src/lib/routes.ts';

test('an article lives under /writing and a project under /work, without a trailing slash', () => {
  assert.equal(entryHref('article', 'first-note'), '/writing/first-note');
  assert.equal(entryHref('project', 'a-project'), '/work/a-project');
});

test('an entry’s path, with or without a trailing slash, tells which kind of entry it is', () => {
  assert.equal(entryKindOf('/writing/first-note'), 'article');
  assert.equal(entryKindOf('/writing/first-note/'), 'article');
  assert.equal(entryKindOf('/work/a-project/'), 'project');
});

test('other pages are not entries, including the section pages and category pages', () => {
  for (const path of ['/', '/about', '/writing', '/writing/', '/work', '/writing/category/engineering', '/now/']) {
    assert.equal(entryKindOf(path), undefined, path);
  }
});

test('trailing slashes are dropped, and the root stays /', () => {
  assert.equal(withoutTrailingSlash('/writing/first-note/'), '/writing/first-note');
  assert.equal(withoutTrailingSlash('/about//'), '/about');
  assert.equal(withoutTrailingSlash('/about'), '/about');
  assert.equal(withoutTrailingSlash('/'), '/');
  assert.equal(withoutTrailingSlash('https://example.com/'), 'https://example.com');
});
