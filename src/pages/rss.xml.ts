import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { newestFirst } from '../lib/archive.ts';
import { getPublished } from '../lib/content.ts';
import { entryHref } from '../lib/routes.ts';
import { site } from '../site.config.ts';

// Published articles only, newest first (architecture §4, §5.5). Links match
// the canonical URLs and the sitemap, with a trailing slash.
export const GET: APIRoute = async (context) => {
  const articles = newestFirst(await getPublished('writing'));
  return rss({
    title: site.name,
    description: site.description,
    site: context.site ?? site.origin,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.published,
      link: `${entryHref('article', article.id)}/`,
    })),
    customData: '<language>en</language>',
  });
};
