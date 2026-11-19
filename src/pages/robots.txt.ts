import type { APIRoute } from 'astro';
import { resolveSiteEnv, robotsTxt } from '../lib/site-env.ts';

export const GET: APIRoute = ({ site }) =>
  new Response(robotsTxt(resolveSiteEnv(process.env), new URL('/sitemap-index.xml', site).href), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
