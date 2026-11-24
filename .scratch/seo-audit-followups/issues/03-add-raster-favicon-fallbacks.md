# 03 — Add raster favicon fallbacks

Status: ready-for-agent
Type: task

## Problem

The site's only icon is `public/favicon.svg`, linked from `src/layouts/BaseLayout.astro`. Modern browsers and Google Search accept it. Anything that requests `/favicon.ico` directly (feed readers, some crawlers, older browsers) gets a 404, and iOS has no `apple-touch-icon` for home-screen bookmarks.

## Open question (owner)

`BaseLayout.astro` marks the `d.` monogram as "drafted in ticket 18, pending owner approval". The raster icons copy that design, so the owner approves it first (design-spec §1: "a simplified monogram as the favicon"). Once approved, record it in Comments, set `Status: ready-for-agent`, and update the comment in `BaseLayout.astro`.

## Scope

Rasterise the existing `public/favicon.svg` artwork as it stands; the design itself doesn't change.

- `public/favicon.ico`: 32 × 32 (a 16 × 16 layer as well is welcome), light palette.
- `public/apple-touch-icon.png`: 180 × 180, light palette, opaque background. iOS applies its own corner mask, so fill the full square edge to edge rather than reusing the SVG's `rx="4"` rounded rect.
- `BaseLayout.astro`: keep the SVG link first and add `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`. The `.ico` is served from its conventional path and needs no tag.

Render the files with Playwright's Chromium, the way `scripts/render-social-image.ts` produces the social image: a checked-in script that can be rerun if the monogram changes. Playwright is already a dev dependency, so no new packages. Chromium screenshots PNG only; write the `.ico` by wrapping the PNG bytes in an ICO header (the ICO format allows PNG-encoded images), which takes a few lines of Node.

The CSP (`src/lib/csp.ts`) governs scripts and styles, not icon links, so it needs no change. Confirm this in the built page's console.

## Done when

- `npm run verify` passes.
- After `npm run build && npm run preview`, `/favicon.ico` and `/apple-touch-icon.png` return 200 with `image/x-icon` (or `image/vnd.microsoft.icon`) and `image/png` respectively, and each opens as a crisp, centred `d.` matching the SVG in the light palette.
- An e2e assertion in `tests/e2e/seo.spec.ts` covers both: the `apple-touch-icon` link is present on the homepage and both URLs return 200.
- The browser tab still shows the SVG icon, switching with the system theme.

## Comments

- 2026-11-23, owner: the `d.` monogram in `public/favicon.svg` is approved as the favicon. Status set to `ready-for-agent`.
- 2026-11-23, agent: implemented on branch `feat/raster-favicons`. `scripts/render-favicons.ts` renders `public/favicon.ico` (16 + 32, PNG-encoded) and `public/apple-touch-icon.png` (180, square, opaque); `BaseLayout.astro` links the touch icon; `tests/e2e/seo.spec.ts` covers all three icon URLs. `npm run verify` passes (402 passed, 24 content-conditional skips).
