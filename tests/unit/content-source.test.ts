import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveContentSource } from '../../src/lib/content-source.ts';

test('production content is the default when CONTENT_SOURCE is unset', () => {
  assert.deepEqual(resolveContentSource({}), {
    name: 'production',
    contentRoot: 'src/content',
    outDir: 'dist',
    publicDirs: ['public'],
  });
});

test('fixture content builds from tests/fixtures into a separate, never-deployed output dir, layering fixture public files over the real ones', () => {
  assert.deepEqual(resolveContentSource({ CONTENT_SOURCE: 'fixtures' }), {
    name: 'fixtures',
    contentRoot: 'tests/fixtures/content',
    outDir: 'dist-fixtures',
    publicDirs: ['public', 'tests/fixtures/public'],
  });
});

test('an unknown CONTENT_SOURCE fails loudly instead of falling back', () => {
  assert.throws(
    () => resolveContentSource({ CONTENT_SOURCE: 'fixture' }),
    /Unknown CONTENT_SOURCE "fixture"/,
  );
});
