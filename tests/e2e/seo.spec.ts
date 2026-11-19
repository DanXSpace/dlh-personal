import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { headMetadata, origin } from '../support/seo.ts';

// Search and social metadata on the production build's pages (PRD FR-13,
// architecture §10). Article and case-study metadata is tested against the
// fixture build in seo.fixtures.spec.ts.

const pages = [
  { path: '/', title: 'Daniel Lee Holung', ogTitle: 'Daniel Lee Holung', canonical: `${origin}/` },
  { path: '/about', title: 'About — Daniel Lee Holung', ogTitle: 'About', canonical: `${origin}/about/` },
  { path: '/work', title: 'Work — Daniel Lee Holung', ogTitle: 'Work', canonical: `${origin}/work/` },
  { path: '/writing', title: 'Writing — Daniel Lee Holung', ogTitle: 'Writing', canonical: `${origin}/writing/` },
  { path: '/now', title: 'Now — Daniel Lee Holung', ogTitle: 'Now', canonical: `${origin}/now/` },
  { path: '/resume', title: 'Résumé — Daniel Lee Holung', ogTitle: 'Résumé', canonical: `${origin}/resume/` },
];

for (const { path, title, ogTitle, canonical } of pages) {
  test(`${path} has a title, description, canonical URL and social tags`, async ({ page }) => {
    await page.goto(path);
    const meta = await headMetadata(page);

    expect(meta.title).toBe(title);
    expect(meta.description).toBeTruthy();
    expect(meta.description!.length).toBeLessThanOrEqual(160);
    expect(meta.canonical).toBe(canonical);

    expect(meta.og).toEqual({
      title: ogTitle,
      description: meta.description,
      url: canonical,
      type: 'website',
      siteName: 'Daniel Lee Holung',
      image: `${origin}/social/default.png`,
      imageAlt: 'Daniel Lee Holung',
    });
    expect(meta.twitter).toEqual({
      card: 'summary_large_image',
      title: ogTitle,
      description: meta.description,
      image: `${origin}/social/default.png`,
    });
  });
}

test('the 404 page has a title and description but no canonical URL', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  const meta = await headMetadata(page);
  expect(meta.title).toBe('Page not found — Daniel Lee Holung');
  expect(meta.description).toBeTruthy();
  expect(meta.canonical).toBeNull();
});

test('the default social image is a 1200 × 630 PNG', async ({ request }) => {
  const response = await request.get('/social/default.png');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('image/png');
  const png = await response.body();
  // PNG signature, then the IHDR chunk's width and height.
  expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test('every page links the RSS feed for autodiscovery', async ({ page }) => {
  await page.goto('/');
  const feed = page.locator('head link[rel="alternate"][type="application/rss+xml"]');
  await expect(feed).toHaveAttribute('href', '/rss.xml');
  await expect(feed).toHaveAttribute('title', 'Daniel Lee Holung');
});

test('the footer links the RSS feed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'RSS' })).toHaveAttribute('href', '/rss.xml');
});

test('the RSS feed is valid with no published articles', async ({ request }) => {
  const response = await request.get('/rss.xml');
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain('<rss version="2.0"');
});

test('the sitemap index lists the sitemap, and /sitemap.xml redirects to it on Cloudflare', async ({ request }) => {
  const index = await (await request.get('/sitemap-index.xml')).text();
  expect(index).toContain(`<loc>${origin}/sitemap-0.xml</loc>`);
  // `astro preview` doesn't apply `_redirects`, so check the rule that ships.
  const redirects = await readFile(new URL('../../dist/_redirects', import.meta.url), 'utf8');
  expect(redirects).toMatch(/^\/sitemap\.xml \/sitemap-index\.xml 301$/m);
});

test('a non-production robots.txt names no sitemap', async ({ request }) => {
  expect(await (await request.get('/robots.txt')).text()).not.toContain('Sitemap:');
});
