# Keep previews non-indexable by branch, not by a per-environment variable

The architecture planned to set `PUBLIC_SITE_ENV` per environment, with `production` on the production deployment and anything else on previews. Cloudflare Workers Builds can't do that: build variables are configured per Worker and apply to every branch, and there is one build command. Setting `production` at launch would make every preview URL indexable too. So `src/lib/site-env.ts` also reads `WORKERS_CI_BRANCH`, which Workers Builds injects. When it is present and isn't `main`, the build is non-indexable whatever `PUBLIC_SITE_ENV` says. Outside Workers Builds (local builds, GitHub Actions) the variable is absent and `PUBLIC_SITE_ENV` alone decides. Decided while implementing ticket 02, 2026-11-18.

**Update, 2026-11-23 (launch):** the Worker now uses Cloudflare's Worker Previews, where production and preview builds each have their own build-variable list ("Production" and "Previews Base"). `PUBLIC_SITE_ENV=production` is set on Production only, so previews never receive it, and the original premise that build variables apply to every branch no longer holds. The branch check stays: it costs nothing and keeps previews `noindex` if `production` is ever added to Previews Base, or if the Worker returns to shared build settings.

## Consequences

- `PUBLIC_SITE_ENV=production` is set once, as a Production build variable, at the launch gate (ticket 20; done 2026-11-23). Leave Previews Base without it.
- The production branch name `main` is hard-coded in `site-env.ts`. Renaming the production branch means changing it there.
- This only ever makes a build *less* indexable than `PUBLIC_SITE_ENV` alone would, so a misconfiguration fails safe.
