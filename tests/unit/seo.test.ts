import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl, documentTitle } from '../../src/lib/seo.ts';

const origin = 'https://example.com';

test('a page title is followed by the site name', () => {
  assert.equal(documentTitle('Work'), 'Work — Daniel Lee Holung');
});

test('the homepage, with no page title, uses its own title from site config', () => {
  assert.equal(documentTitle(undefined), 'Daniel Lee Holung — Engineer & Developer');
});

test('the canonical URL of the homepage is the site origin', () => {
  assert.equal(canonicalUrl('/', origin), 'https://example.com/');
});

test('canonical URLs end in a slash, matching how directory pages are served', () => {
  assert.equal(canonicalUrl('/work', origin), 'https://example.com/work/');
  assert.equal(canonicalUrl('/writing/an-article/', origin), 'https://example.com/writing/an-article/');
});

test('canonical URLs drop index.html and .html file names', () => {
  assert.equal(canonicalUrl('/work/index.html', origin), 'https://example.com/work/');
  assert.equal(canonicalUrl('/about.html', origin), 'https://example.com/about/');
});

test('the canonical URL ignores a trailing slash on the configured origin', () => {
  assert.equal(canonicalUrl('/work', 'https://example.com/'), 'https://example.com/work/');
});

test('the 404 page has no canonical URL, since it stands in for any missing address', () => {
  assert.equal(canonicalUrl('/404', origin), undefined);
  assert.equal(canonicalUrl('/404.html', origin), undefined);
  assert.equal(canonicalUrl('/404/', origin), undefined);
});
