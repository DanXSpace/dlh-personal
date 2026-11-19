import type { APIRoute } from 'astro';
import { resolveSiteEnv, robotsTxt } from '../lib/site-env.ts';

export const GET: APIRoute = () =>
  new Response(robotsTxt(resolveSiteEnv(process.env)), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
