import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveContentSource } from '../../src/lib/content-source.ts';

test('production content is the default when CONTENT_SOURCE is unset', () => {
  assert.deepEqual(resolveContentSource({}), {
    name: 'production',
    contentRoot: 'src/content',
    outDir: 'dist',
  });
});

test('fixture content builds from tests/fixtures into a separate, never-deployed output dir', () => {
  assert.deepEqual(resolveContentSource({ CONTENT_SOURCE: 'fixtures' }), {
    name: 'fixtures',
    contentRoot: 'tests/fixtures/content',
    outDir: 'dist-fixtures',
  });
});

test('an unknown CONTENT_SOURCE fails loudly instead of falling back', () => {
  assert.throws(
    () => resolveContentSource({ CONTENT_SOURCE: 'fixture' }),
    /Unknown CONTENT_SOURCE "fixture"/,
  );
});
