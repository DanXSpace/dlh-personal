import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSiteEnv, robotsTxt } from '../../src/lib/site-env.ts';

test('a build is not indexable when PUBLIC_SITE_ENV is unset', () => {
  assert.equal(resolveSiteEnv({}).indexable, false);
});

test('only PUBLIC_SITE_ENV=production makes a build indexable', () => {
  assert.equal(resolveSiteEnv({ PUBLIC_SITE_ENV: 'production' }).indexable, true);
});

test('any other PUBLIC_SITE_ENV value keeps a build out of search indexes', () => {
  for (const value of ['', 'preview', 'staging', 'Production', ' production']) {
    assert.equal(resolveSiteEnv({ PUBLIC_SITE_ENV: value }).indexable, false, `value ${JSON.stringify(value)}`);
  }
});

test('a Workers Builds preview of another branch is never indexable, even with PUBLIC_SITE_ENV=production', () => {
  // Workers Builds shares build variables across branches, so setting
  // `production` at launch must not make preview URLs indexable.
  assert.equal(
    resolveSiteEnv({ PUBLIC_SITE_ENV: 'production', WORKERS_CI_BRANCH: 'feature/about-page' }).indexable,
    false,
  );
});

test('a Workers Builds build of main with PUBLIC_SITE_ENV=production is indexable', () => {
  assert.equal(
    resolveSiteEnv({ PUBLIC_SITE_ENV: 'production', WORKERS_CI_BRANCH: 'main' }).indexable,
    true,
  );
});

const sitemap = 'https://example.com/sitemap-index.xml';

test('a non-indexable build disallows every crawler from every path and names no sitemap', () => {
  assert.equal(robotsTxt({ indexable: false }, sitemap), 'User-agent: *\nDisallow: /\n');
});

test('an indexable build allows every crawler and points to the sitemap index', () => {
  assert.equal(
    robotsTxt({ indexable: true }, sitemap),
    'User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap-index.xml\n',
  );
});
