import type { APIRequestContext, Page } from '@playwright/test';

/** The canonical origin in `src/site.config.ts`: the custom domain (ticket 19). */
export const origin = 'https://danielholung.dev';

/** Every page URL in the build's sitemap, as absolute canonical URLs. */
export async function sitemapUrls(request: APIRequestContext): Promise<string[]> {
  const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
  const index = await (await request.get('/sitemap-index.xml')).text();
  const urls: string[] = [];
  for (const sitemap of locs(index)) {
    urls.push(...locs(await (await request.get(new URL(sitemap).pathname)).text()));
  }
  return urls;
}

/** The search and social metadata in a page's head. */
export async function headMetadata(page: Page) {
  return page.evaluate(() => {
    const meta = (selector: string) => document.head.querySelector(selector)?.getAttribute('content') ?? null;
    const property = (name: string) => meta(`meta[property="${name}"]`);
    const named = (name: string) => meta(`meta[name="${name}"]`);
    return {
      title: document.title,
      description: named('description'),
      canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      og: {
        title: property('og:title'),
        description: property('og:description'),
        url: property('og:url'),
        type: property('og:type'),
        siteName: property('og:site_name'),
        image: property('og:image'),
        imageAlt: property('og:image:alt'),
      },
      twitter: {
        card: named('twitter:card'),
        title: named('twitter:title'),
        description: named('twitter:description'),
        image: named('twitter:image'),
      },
    };
  });
}

/** Every JSON-LD node on the page, with `@graph` arrays flattened. */
export async function structuredData(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((text) => {
    const data = JSON.parse(text) as Record<string, unknown>;
    return Array.isArray(data['@graph']) ? (data['@graph'] as Record<string, unknown>[]) : [data];
  });
}

/** The JSON-LD nodes of one `@type`. */
export async function nodesOfType(page: Page, type: string): Promise<Record<string, unknown>[]> {
  return (await structuredData(page)).filter((node) => node['@type'] === type);
}
