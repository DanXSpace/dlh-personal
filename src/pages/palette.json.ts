import type { APIRoute } from 'astro';
import { getPublished } from '../lib/content.ts';
import { paletteEntries } from '../lib/palette.ts';
import { resumeLinks, siteResumeAccess } from '../lib/resume.ts';
import { site } from '../site.config.ts';

/**
 * The command palette's entry list (architecture §9), built with the site and
 * fetched only when the palette first opens. Published content only, and the
 * résumé only once its PDF is hosted, like every other résumé link.
 */
export const GET: APIRoute = async () => {
  const entries = paletteEntries({
    pages: [...site.nav, ...resumeLinks(siteResumeAccess())],
    articles: await getPublished('writing'),
    projects: await getPublished('projects'),
  });
  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
