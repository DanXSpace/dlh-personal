import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { draftFlag, draftImages, leakedAssets } from '../../src/lib/draft-assets.ts';

test('the draft flag is a top-level `draft: true` in the frontmatter only', () => {
  assert.equal(draftFlag('---\ntitle: A\ndraft: true\n---\nBody'), true);
  assert.equal(draftFlag('---\n# a comment\ndraft: true # until approved\n---\n'), true);
  assert.equal(draftFlag('---\ndraft: True\n---\n'), true);
  assert.equal(draftFlag('---\ntitle: A\ndraft: false\n---\n'), false);
  assert.equal(draftFlag('---\nmeta:\n  draft: true\n---\n'), false);
  assert.equal(draftFlag('---\ntitle: A\n---\ndraft: true\n'), false);
  assert.equal(draftFlag('draft: true\n'), false);
});

/** A content root with one draft and one published entry, each with an image, and a build that copied both. */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'draft-assets-'));
  const content = join(root, 'content');
  const out = join(root, 'dist');
  mkdirSync(join(content, 'projects/draft'), { recursive: true });
  mkdirSync(join(content, 'projects/live'), { recursive: true });
  mkdirSync(join(out, '_astro'), { recursive: true });
  writeFileSync(join(content, 'projects/draft/index.mdx'), '---\ndraft: true\nthumbnail: ./shot.png\n---\n');
  writeFileSync(join(content, 'projects/draft/shot.png'), 'draft image bytes');
  writeFileSync(join(content, 'projects/live/index.md'), '---\nthumbnail: ./shot.png\n---\n');
  writeFileSync(join(content, 'projects/live/shot.png'), 'published image bytes');
  writeFileSync(join(out, '_astro/shot.AAAA.png'), 'draft image bytes');
  writeFileSync(join(out, '_astro/shot.BBBB.png'), 'published image bytes');
  writeFileSync(join(out, '_astro/shot.BBBB_x.webp'), 'optimised');
  writeFileSync(join(out, 'index.html'), '<img src="/_astro/shot.BBBB_x.webp">');
  return { content, out };
}

test('only images beside a draft entry are draft images', () => {
  const { content } = fixture();
  assert.deepEqual(draftImages(content), [join(content, 'projects/draft/shot.png')]);
});

test('an unreferenced copy of a draft image in the build is a leak; published images are not', () => {
  const { content, out } = fixture();
  assert.deepEqual(leakedAssets(out, draftImages(content)), [join(out, '_astro/shot.AAAA.png')]);
});

test('a copy that a built page refers to is kept', () => {
  const { content, out } = fixture();
  writeFileSync(join(out, 'other.html'), '<img src="/_astro/shot.AAAA.png">');
  assert.deepEqual(leakedAssets(out, draftImages(content)), []);
});

test('a build without drafts or without an `_astro` folder has no leaks', () => {
  const { out } = fixture();
  assert.deepEqual(leakedAssets(out, []), []);
  assert.deepEqual(leakedAssets(join(out, 'missing'), ['x.png']), []);
});
