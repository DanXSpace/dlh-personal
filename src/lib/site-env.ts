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

/**
 * The `robots.txt` body: disallow-all for previews; allow-all for production,
 * pointing to the sitemap index (architecture §10.4).
 */
export function robotsTxt({ indexable }: SiteEnv, sitemapUrl: string): string {
  return indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`
    : 'User-agent: *\nDisallow: /\n';
}

/**
 * Why an indexable build must not ship with this origin, or `undefined` when
 * it may. A `*.workers.dev` origin is the interim address used until the
 * owner's custom domain is attached (ticket 19), so canonical URLs, the
 * sitemap and RSS built from it would point search engines at the wrong host.
 * Previews may keep using it.
 */
export function launchOriginProblem({ indexable }: SiteEnv, origin: string): string | undefined {
  if (!indexable || !new URL(origin).hostname.endsWith('.workers.dev')) return undefined;
  return (
    `This build is indexable (PUBLIC_SITE_ENV=production) but the site origin is still the interim ` +
    `workers.dev address (${origin}). Set \`origin\` in src/site.config.ts to the custom domain ` +
    `before turning on indexing (ticket 19).`
  );
}
