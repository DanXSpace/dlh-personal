/**
 * Decides whether a build may be indexed by search engines.
 *
 * `PUBLIC_SITE_ENV` is read at build time. Only the exact value `production`
 * makes a build indexable; anything else, including unset, is treated as a
 * preview so nothing is indexed by accident. See `docs/architecture.md` §10.4.
 *
 * Cloudflare Workers Builds shares build variables across every branch, so a
 * Workers Builds run (`WORKERS_CI_BRANCH` set) is only indexable on `main`,
 * the production branch. Preview URLs stay out of search indexes even after
 * `production` is set at launch. See ADR-0005.
 */
export interface SiteEnv {
  indexable: boolean;
}

const PRODUCTION_BRANCH = 'main';

export function resolveSiteEnv(env: Record<string, string | undefined>): SiteEnv {
  const branch = env['WORKERS_CI_BRANCH'];
  const isPreviewBranch = branch !== undefined && branch !== PRODUCTION_BRANCH;
  return { indexable: env['PUBLIC_SITE_ENV'] === 'production' && !isPreviewBranch };
}

/** The `robots.txt` body: disallow-all for previews, allow-all for production. */
export function robotsTxt({ indexable }: SiteEnv): string {
  return indexable ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n';
}
