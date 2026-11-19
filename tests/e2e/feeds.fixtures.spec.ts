import { expect, test } from '@playwright/test';
import { origin, sitemapUrls } from '../support/seo.ts';

// The sitemap and RSS feed of the fixture build (ADR-0004), which is a
// production build, so draft fixtures must be left out of both.

test.describe('sitemap', () => {
  test('lists published articles, case studies and listing pages at canonical URLs', async ({ request }) => {
    const urls = await sitemapUrls(request);
    for (const path of [
      '/',
      '/work/',
      '/writing/',
      '/writing/article-template-fixture/',
      '/writing/category/engineering/',
      '/work/case-study-fixture/',
    ]) {
      expect(urls).toContain(`${origin}${path}`);
    }
  });

  test('leaves out drafts and the 404 page', async ({ request }) => {
    const urls = await sitemapUrls(request);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((url) => /draft|404/.test(url))).toEqual([]);
  });
});

test.describe('RSS feed', () => {
  test('is an RSS 2.0 document for the site', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/xml/);
    const body = await response.text();
    expect(body).toMatch(/^<\?xml/);
    expect(body).toContain('<rss version="2.0"');
    expect(body).toContain('<title>Daniel Lee Holung</title>');
    expect(body).toContain(`<link>${origin}/</link>`);
  });

  test('lists published articles newest first, linking to their canonical URLs', async ({ request }) => {
    const body = await (await request.get('/rss.xml')).text();
    const items = [...body.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]!);
    const links = items.map((item) => item.match(/<link>([^<]+)<\/link>/)?.[1]);
    expect(links).toEqual([
      `${origin}/writing/mdx-components-fixture/`,
      `${origin}/writing/article-template-fixture/`,
      `${origin}/writing/a-much-longer-title-fixture-for-checking-how-article-headings-wrap/`,
      `${origin}/writing/contents-opt-in-fixture/`,
      `${origin}/writing/earlier-year-fixture/`,
    ]);

    const item = items[1]!;
    expect(item).toContain('<title>Article template fixture</title>');
    expect(item).toContain(
      '<description>Test fixture that exercises every Markdown element the article template supports.</description>',
    );
    expect(item).toContain('<pubDate>Sat, 14 Mar 2026 00:00:00 GMT</pubDate>');
  });

  test('leaves out drafts', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<item>');
    expect(body).not.toContain('draft-fixture');
    expect(body).not.toContain('Draft fixture');
  });
});
