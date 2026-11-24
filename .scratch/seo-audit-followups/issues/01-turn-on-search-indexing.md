# 01 — Turn on search indexing

Status: ready-for-human
Type: task

## Problem

Production is invisible to search engines. Every page on `https://danielholung.dev/` serves `<meta name="robots" content="noindex, nofollow">`, and `/robots.txt` returns `Disallow: /`. That is intended until launch: only a build with `PUBLIC_SITE_ENV=production` is indexable (architecture §10.4, `src/lib/site-env.ts`), and the variable has not been set. This ticket is the indexing step of the launch gate (ticket 20 in ADR-0005).

## Before flipping the switch

Indexing is the point of no return for anything a crawler sees. Confirm each item, then record it in Comments:

- [ ] The owner has decided the site is ready to launch.
- [ ] No preview assets ship: `src/assets/hero.ts` has `preview: false` (it does as of 2026-11-23), and no built page contains `data-preview-asset`. Check with `npm run build && ! grep -rl data-preview-asset dist/`.
- [ ] No draft or placeholder content appears in the production build (CLAUDE.md, content integrity).

## Steps (Cloudflare dashboard)

1. Worker `dlh-personal` → Settings → Build → Variables and secrets: add `PUBLIC_SITE_ENV` = `production`.
2. Trigger a production build of `main` (Deployments → retry the latest `main` build, or push to `main`).

Previews stay `noindex` with no extra step: on Workers Builds, any branch other than `main` is non-indexable regardless of the variable (ADR-0005).

## Done when

All of these hold against the live site:

- `curl -s https://danielholung.dev/ | grep -c 'name="robots"'` prints `0`.
- `curl -s https://danielholung.dev/robots.txt` prints `Allow: /` and `Sitemap: https://danielholung.dev/sitemap-index.xml`.
- A branch preview URL still serves the `noindex` meta tag and `Disallow: /`.

## Follow-up (optional, owner)

Add the domain to Google Search Console and submit `https://danielholung.dev/sitemap-index.xml` so crawling starts sooner. Verifying ownership with a DNS TXT record keeps the site free of verification markup.

## Comments
