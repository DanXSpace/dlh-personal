import { expect, test } from '@playwright/test';
import { headMetadata, nodesOfType, origin, sitemapUrls, structuredData } from '../support/seo.ts';

// Search, social and structured metadata against fixture content (ADR-0004,
// PRD FR-13, architecture §10).

const article = '/writing/article-template-fixture';
const articleWithImage = '/writing/mdx-components-fixture';
const caseStudy = '/work/case-study-fixture';
const minimalCaseStudy = '/work/minimal-case-study-fixture';
const category = '/writing/category/engineering';
const defaultImage = `${origin}/social/default.png`;

test('every page in the sitemap has a unique title, a description and its sitemap URL as canonical', async ({
  page,
  request,
}) => {
  const urls = await sitemapUrls(request);
  expect(urls.length).toBeGreaterThan(5);
  const titles = new Set<string>();
  for (const url of urls) {
    await page.goto(new URL(url).pathname);
    const meta = await headMetadata(page);
    // Most titles follow `Page — Daniel Lee Holung`; the homepage and any case
    // study with a `metaTitle` set their own (unit-tested in seo.test.ts).
    expect(meta.title, url).toBeTruthy();
    expect(titles.has(meta.title), `duplicate title "${meta.title}" on ${url}`).toBe(false);
    titles.add(meta.title);
    expect(meta.description, url).toBeTruthy();
    expect(meta.canonical, url).toBe(url);
    expect(meta.og.url, url).toBe(url);
    expect(meta.og.image, url).toMatch(new RegExp(`^${origin}/`));
    expect(meta.twitter.card, url).toBe('summary_large_image');
  }
});

test.describe('articles', () => {
  test('describe themselves with the article description as an Open Graph article', async ({ page }) => {
    await page.goto(article);
    const meta = await headMetadata(page);
    expect(meta.title).toBe('Article template fixture — Daniel Lee Holung');
    expect(meta.description).toBe('Test fixture that exercises every Markdown element the article template supports.');
    expect(meta.og.title).toBe('Article template fixture');
    expect(meta.og.type).toBe('article');
    expect(meta.og.image).toBe(defaultImage);
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
      'content',
      '2026-03-14T00:00:00.000Z',
    );
    await expect(page.locator('meta[property="article:modified_time"]')).toHaveAttribute(
      'content',
      '2026-04-02T00:00:00.000Z',
    );
  });

  test('share their own image when the entry sets ogImage', async ({ page, request }) => {
    await page.goto(articleWithImage);
    const meta = await headMetadata(page);
    expect(meta.og.image).not.toBe(defaultImage);
    expect(meta.og.image).toMatch(new RegExp(`^${origin}/_astro/.+\\.jpg$`));
    expect(meta.twitter.image).toBe(meta.og.image);
    const image = await request.get(new URL(meta.og.image!).pathname);
    expect(image.status()).toBe(200);
  });

  test('carry BlogPosting structured data', async ({ page }) => {
    await page.goto(article);
    const [posting] = await nodesOfType(page, 'BlogPosting');
    expect(posting).toMatchObject({
      headline: 'Article template fixture',
      description: 'Test fixture that exercises every Markdown element the article template supports.',
      datePublished: '2026-03-14T00:00:00.000Z',
      dateModified: '2026-04-02T00:00:00.000Z',
      url: `${origin}${article}/`,
      mainEntityOfPage: `${origin}${article}/`,
      image: defaultImage,
      author: { '@type': 'Person', name: 'Daniel Lee Holung', url: `${origin}/` },
    });
  });

  test('carry a breadcrumb trail of Home, Writing and the article', async ({ page }) => {
    await page.goto(article);
    const [breadcrumbs] = await nodesOfType(page, 'BreadcrumbList');
    expect(breadcrumbs?.['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Writing', item: `${origin}/writing/` },
      { '@type': 'ListItem', position: 3, name: 'Article template fixture', item: `${origin}${article}/` },
    ]);
  });
});

test.describe('case studies', () => {
  test('describe themselves with the project summary and share the cover image', async ({ page }) => {
    await page.goto(caseStudy);
    const meta = await headMetadata(page);
    expect(meta.title).toBe('Case study fixture — Daniel Lee Holung');
    expect(meta.description).toMatch(/^Test fixture that exercises every part of the case study template\./);
    expect(meta.og.image).toMatch(new RegExp(`^${origin}/_astro/.+\\.jpg$`));
    expect(meta.og.imageAlt).toBe('A wide gray placeholder ridgeline, cropped for the case study.');
  });

  test('without a cover, share the default image', async ({ page }) => {
    await page.goto(minimalCaseStudy);
    expect((await headMetadata(page)).og.image).toBe(defaultImage);
  });

  test('with a repository, carry SoftwareSourceCode structured data', async ({ page }) => {
    await page.goto(caseStudy);
    const [work] = await nodesOfType(page, 'SoftwareSourceCode');
    expect(work).toMatchObject({
      name: 'Case study fixture',
      url: `${origin}${caseStudy}/`,
      codeRepository: 'https://example.com/fixture/repository',
      author: { '@type': 'Person', name: 'Daniel Lee Holung' },
    });
    expect(work?.['description']).toMatch(/^Test fixture/);
  });

  test('without a repository, carry CreativeWork structured data', async ({ page }) => {
    await page.goto(minimalCaseStudy);
    expect(await nodesOfType(page, 'SoftwareSourceCode')).toEqual([]);
    const [work] = await nodesOfType(page, 'CreativeWork');
    expect(work).toMatchObject({
      name: 'Minimal case study fixture',
      description: 'Test fixture with only the required fields and a single section.',
      url: `${origin}${minimalCaseStudy}/`,
    });
  });

  test('carry a breadcrumb trail of Home, Work and the project', async ({ page }) => {
    await page.goto(caseStudy);
    const [breadcrumbs] = await nodesOfType(page, 'BreadcrumbList');
    expect(breadcrumbs?.['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Work', item: `${origin}/work/` },
      { '@type': 'ListItem', position: 3, name: 'Case study fixture', item: `${origin}${caseStudy}/` },
    ]);
  });
});

test('category pages carry a breadcrumb trail of Home, Writing and the category', async ({ page }) => {
  await page.goto(category);
  const [breadcrumbs] = await nodesOfType(page, 'BreadcrumbList');
  expect(breadcrumbs?.['itemListElement']).toEqual([
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
    { '@type': 'ListItem', position: 2, name: 'Writing', item: `${origin}/writing/` },
    { '@type': 'ListItem', position: 3, name: 'Engineering', item: `${origin}${category}/` },
  ]);
});

test('the homepage carries Person and WebSite structured data', async ({ page }) => {
  await page.goto('/');
  const [person] = await nodesOfType(page, 'Person');
  const [website] = await nodesOfType(page, 'WebSite');
  expect(person).toMatchObject({ '@id': `${origin}/#person`, name: 'Daniel Lee Holung', url: `${origin}/` });
  expect(website).toMatchObject({
    '@id': `${origin}/#website`,
    name: 'Daniel Lee Holung',
    url: `${origin}/`,
    author: { '@id': `${origin}/#person` },
  });
});

test('top-level listing pages carry no breadcrumbs or identity data', async ({ page }) => {
  for (const path of ['/work', '/writing']) {
    await page.goto(path);
    expect(await structuredData(page), path).toEqual([]);
  }
});

test('every structured data block names schema.org as its context', async ({ page }) => {
  for (const path of ['/', article, caseStudy, category]) {
    await page.goto(path);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, path).toBeGreaterThan(0);
    for (const block of blocks) expect(JSON.parse(block)['@context'], path).toBe('https://schema.org');
  }
});
