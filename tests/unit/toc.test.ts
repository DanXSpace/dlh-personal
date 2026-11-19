import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tableOfContents } from '../../src/lib/toc.ts';

const h = (depth: number, text: string) => ({ depth, slug: text.toLowerCase(), text });

test('an article with fewer than three h2s has no table of contents by default', () => {
  assert.deepEqual(tableOfContents([h(2, 'One'), h(3, 'Detail'), h(2, 'Two')], undefined), []);
});

test('three or more h2s produce a table of contents of h2s with their h3s nested', () => {
  const headings = [h(2, 'One'), h(3, 'Detail'), h(4, 'Deep'), h(2, 'Two'), h(2, 'Three'), h(3, 'More')];
  assert.deepEqual(tableOfContents(headings, undefined), [
    { slug: 'one', text: 'One', children: [{ slug: 'detail', text: 'Detail' }] },
    { slug: 'two', text: 'Two', children: [] },
    { slug: 'three', text: 'Three', children: [{ slug: 'more', text: 'More' }] },
  ]);
});

test('frontmatter can opt a short article in', () => {
  assert.deepEqual(tableOfContents([h(2, 'Only')], true), [{ slug: 'only', text: 'Only', children: [] }]);
});

test('frontmatter can opt a long article out', () => {
  assert.deepEqual(tableOfContents([h(2, 'One'), h(2, 'Two'), h(2, 'Three')], false), []);
});

test('an h3 before the first h2 is listed at the top level rather than dropped', () => {
  assert.deepEqual(tableOfContents([h(3, 'Intro'), h(3, 'Aside'), h(2, 'One')], true), [
    { slug: 'intro', text: 'Intro', children: [] },
    { slug: 'aside', text: 'Aside', children: [] },
    { slug: 'one', text: 'One', children: [] },
  ]);
});
