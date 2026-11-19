# Host on Cloudflare Workers static assets, not Cloudflare Pages

The PRD named Cloudflare Pages, but Cloudflare now directs new platform features (gradual deployments, rollbacks, Workers Logs, serving assets on a path) to Workers static assets, while Pages remains supported but static. Since every route is prerendered, the site deploys `dist/` as a Worker's static assets with no Worker script and no Astro adapter. Decided by the owner on 2026-11-18.

## Consequences

- `wrangler.jsonc` must set `assets.not_found_handling: "404-page"`, or unknown URLs won't serve the custom 404 (Pages inferred this; Workers does not).
- The custom domain must be on a Cloudflare-managed zone; Workers does not support custom domains outside Cloudflare zones.
- `_headers` and `_redirects` in the asset directory are supported natively, so security headers and the `/sitemap.xml` redirect work as on Pages.
