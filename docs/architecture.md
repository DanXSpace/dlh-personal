# Architecture

**Status:** Draft; open decisions resolved by the owner on 2026-11-18 except the custom domain (§15)
**Derived from:** `docs/prd.md` §9 and the requirements it serves
**Versions verified:** 2026-11-18 against the npm registry and official Astro and Cloudflare docs

This document records how the site is built and why. Visual decisions (tokens, type scale, layout grids) belong to `docs/design-spec.md`; this document only describes where they live in code.

---

## 1. Principles

1. **Static-first.** Every route is prerendered at build time. No server runtime, no adapter, no backend.
2. **Zero JavaScript by default.** Pages ship HTML and CSS. Client scripts exist only where an interaction requires them (§9), and each one is small, vanilla TypeScript, and optional to the page's core function.
3. **Content is data.** Pages are templates over validated content collections. Publishing never requires touching a component (FR-12).
4. **One source per concern.** Tokens in one file, site identity in one file, schemas in one file.
5. **Fewer dependencies.** Prefer a platform feature or a few lines of in-repo code over a package. Every dependency in §13 maps to a requirement.

## 2. Stack

| Concern | Choice | Version | Notes |
| --- | --- | --- | --- |
| Runtime | Node.js | 24 LTS (≥ 22.23.4) | Astro 7 requires `node >= 22.23.4`. Pin with `.nvmrc` and `engines`. |
| Package manager | npm | ≥ 10 | Already installed; no extra tooling needed. |
| Framework | Astro | 7.4.x | Static output (`output: 'static'`, the default). |
| Language | TypeScript | **6.0.x** | Not 7.x: `@astrojs/check` peer range is `^5 \|\| ^6`. Revisit when it supports 7. |
| Content | Astro content collections + `@astrojs/mdx` | 8.1.x | Markdown via Astro 7's default Sätteri processor (§6). |
| Styling | Tailwind CSS via `@tailwindcss/vite` + CSS custom properties | 4.3.x | Tokens as CSS variables, exposed to Tailwind with `@theme inline` (§7). |
| Fonts | Astro Fonts API, Fontsource provider | built-in | Self-hosted at build time with generated fallback metrics (§7.3). |
| Images | `astro:assets` + `sharp` | built-in / 0.35.x | AVIF/WebP, explicit dimensions. |
| Sitemap | `@astrojs/sitemap` | 3.7.x | |
| RSS | `@astrojs/rss` | 4.0.x | |
| Search (secondary) | Pagefind | 1.6.x | Static index generated post-build. |
| Type/template check | `@astrojs/check` | 0.9.x | |
| Browser tests | `@playwright/test` | 1.65.x | |
| Accessibility tests | `@axe-core/playwright` | 4.14.x | Supplemented by manual checks. |
| Hosting | Cloudflare **Workers static assets** | `wrangler` 4.x | Deviation from PRD §9 — see §12.1. |
| CI | GitHub Actions | — | Validation gate; Cloudflare Workers Builds deploys. |

### 2.1 Deviations from PRD §9 (approved 2026-11-18)

- **Cloudflare Workers static assets instead of Cloudflare Pages.** Cloudflare's compatibility matrix shows Workers with the broader feature set, and new platform features land there. Pages still works. Both support `_headers`, `_redirects`, custom domains and preview URLs. See §12.1 and ADR-0001.
- **TypeScript 6.0.x instead of latest (7.x).** Forced by `@astrojs/check` compatibility. See ADR-0003.
- **No `@tailwindcss/typography`.** Article prose styles are hand-written against the design tokens so they follow the Quiet Precision spec exactly rather than overriding a third-party default.

## 3. Repository layout

```
/
├── CLAUDE.md
├── astro.config.ts
├── tsconfig.json                 # extends astro/tsconfigs/strictest
├── wrangler.jsonc                # static assets config (§12)
├── .nvmrc
├── docs/
│   ├── prd.md
│   ├── design-spec.md
│   ├── architecture.md
│   ├── adr/                      # decisions, created as they are made
│   └── agents/
├── public/
│   ├── _headers                  # security headers (§11)
│   ├── resume.pdf                # only once supplied by the owner
│   └── favicon.svg
├── src/
│   ├── site.config.ts            # identity, nav, links (§5.4)
│   ├── content.config.ts         # collection schemas (§5)
│   ├── content/
│   │   ├── projects/<slug>/index.mdx (+ colocated images)
│   │   ├── writing/<slug>/index.{md,mdx} (+ colocated images)
│   │   └── now/index.md
│   ├── assets/                   # site-wide images (hero, portrait)
│   ├── components/
│   │   ├── layout/               # Header, Footer, Nav, ThemeToggle, Seo
│   │   ├── content/              # MDX components: Callout, Figure, Gallery, Diagram, Meta
│   │   └── ui/                   # small shared primitives
│   ├── layouts/
│   │   ├── BaseLayout.astro      # <html>, head, theme init, shell
│   │   ├── ArticleLayout.astro
│   │   └── CaseStudyLayout.astro
│   ├── lib/                      # pure functions: content queries, reading time, dates, JSON-LD
│   ├── pages/                    # routes (§4), including robots.txt.ts (§10.4)
│   ├── markdown/                 # in-repo Sätteri plugins (§6)
│   └── styles/
│       ├── tokens.css            # the only place raw color/space/type values live
│       ├── global.css            # Tailwind import, @theme inline, base element styles
│       └── prose.css             # article and case-study typography
└── tests/
    ├── e2e/                      # Playwright: routes, nav, theme, palette
    ├── a11y/                     # axe per route × theme
    ├── fixtures/content/         # fixture entries, built only with CONTENT_SOURCE=fixtures (ADR-0004)
    └── unit/                     # lib/ functions
```

## 4. Routes

| Route | File | Source |
| --- | --- | --- |
| `/` | `pages/index.astro` | featured `projects`, 3 newest `writing`, `now` summary |
| `/about` | `pages/about.astro` | page content in an MDX partial so copy edits avoid template edits |
| `/work` | `pages/work/index.astro` | published `projects` |
| `/work/[slug]` | `pages/work/[slug].astro` | `getStaticPaths` over published `projects` |
| `/writing` | `pages/writing/index.astro` | published `writing`, grouped by year |
| `/writing/category/[category]` | `pages/writing/category/[category].astro` | category filter (§8.1) |
| `/writing/[slug]` | `pages/writing/[slug].astro` | `getStaticPaths` over published `writing` |
| `/now` | `pages/now.astro` | `now` entry |
| `/resume` | `pages/resume.astro` | links to `/resume.pdf` once supplied |
| `/rss.xml` | `pages/rss.xml.ts` | published `writing` |
| `/robots.txt` | `pages/robots.txt.ts` | `lib/site-env.ts` (§10.4) |
| `/sitemap-index.xml` | `@astrojs/sitemap` | all built routes |
| 404 | `pages/404.astro` | served via `not_found_handling` (§12) |

**Note:** `@astrojs/sitemap` emits `/sitemap-index.xml` and `/sitemap-0.xml`. To meet the PRD's `/sitemap.xml`, add a `_redirects` rule (`/sitemap.xml /sitemap-index.xml 301`) and reference the index in `robots.txt`.

## 5. Content model

All schemas live in `src/content.config.ts`, use the `glob()` loader, and use `z` from `astro/zod` (Zod 4). Images use the schema `image()` helper so missing files fail the build.

### 5.1 `projects`

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `title` | string | ✓ | |
| `summary` | string (≤ 160) | ✓ | directory blurb + meta description |
| `thumbnail` | image | ✓ | |
| `thumbnailAlt` | string | ✓ | enforced so alt text is never forgotten |
| `stack` | string[] (≥ 1) | ✓ | |
| `status` | enum `active \| maintained \| complete \| archived` | ✓ | approved 2026-11-18 |
| `type` | enum `application \| experiment \| other` | ✓ | FR-03 |
| `year` | number | ✓ | |
| `featured` | boolean | | homepage selection, default `false` |
| `order` | number | | homepage/directory sort override |
| `repo` | url | | rendered only when present |
| `live` | url | | rendered only when present |
| `draft` | boolean | | default `false` |

The case-study body (FR-04 sections) is MDX prose using the content components, not frontmatter, so sections can be omitted honestly when they do not apply.

### 5.2 `writing`

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `title` | string | ✓ | |
| `description` | string (≤ 160) | ✓ | meta description, RSS summary |
| `deck` | string | | optional standfirst under the title (design-spec §4) |
| `published` | date | ✓ | |
| `updated` | date | | must be ≥ `published` (refinement) |
| `category` | enum `engineering \| build-logs \| learning \| technology \| life` | ✓ | FR-05 |
| `project` | `reference('projects')` | | links build logs to case studies (related content) |
| `toc` | boolean | | default: on when ≥ 3 `h2`s |
| `ogImage` | image | | falls back to site default |
| `draft` | boolean | | default `false` |

Author is a single constant from `site.config.ts`, not a per-post field.

### 5.3 `now`

Single entry (`now/index.md`) with `updated: date` (required) and a body using `##` headings for Building, Learning, Exploring, Training and Listening. The homepage summary comes from an optional `summary` frontmatter field.

### 5.4 Site identity — `src/site.config.ts`

Name, tagline, description, canonical origin, nav items, and social/contact links. **Contact fields start empty.** Components render a link only when its value is set, so nothing placeholder-shaped can reach production (FR-10, PRD §11). This file is typed so a missing required field is a type error.

### 5.5 Drafts and validation

- Collection loaders take their `base` from `resolveContentSource(process.env).contentRoot` (`lib/content-source.ts`), so template tests can build against fixtures into `dist-fixtures/` without fixtures ever reaching `dist/` (ADR-0004).
- `lib/content.ts` exposes `getPublished(collection)`, which filters `draft: true` when `import.meta.env.PROD`. Every page, RSS, sitemap and search reads through it, so the FR-06 rule lives in one place. Drafts still render in `astro dev`.
- Schema violations fail the build with Astro's field-level error messages.
- **Duplicate slugs:** the glob loader warns rather than fails on a duplicate id, and its optional `prerenderConflictBehavior: 'error'` check can miss a duplicate when two new files load concurrently. Instead each collection's loader takes its `generateId` from `lib/content-ids.ts`, which sees every file in turn and fails the build naming both files. Entries are `<slug>.md` or `<slug>/index.md`, and a slug that isn't lowercase and hyphenated also fails the build (ticket 06).
- **Reading time** is computed in `lib/reading-time.ts` from the entry's raw `body` (word count ÷ ~230 wpm, code blocks stripped). No dependency or Markdown plugin needed.

## 6. Markdown and MDX pipeline

Astro 7 replaced remark/rehype with the Rust-based **Sätteri** processor by default. The plan stays on Sätteri and avoids the `unified()` fallback unless a requirement forces it.

| Need | Approach |
| --- | --- |
| Heading IDs | Built in (`github-slugger`). |
| Table of contents | `headings` returned by `render()`; `lib/toc.ts` picks the `h2`/`h3`s and `components/ui/TableOfContents.astro` renders them for `ArticleLayout` and `CaseStudyLayout`. |
| Heading anchor links | In-repo Sätteri `hastPlugins` entry in `src/markdown/` (ordered after `satteriHeadingIdsPlugin()`). |
| Syntax highlighting | Astro's built-in Shiki, which works under Sätteri (verified in ticket 06). Shiki colours tokens with inline `style` attributes, which the CSP (§11) blocks, so it uses Astro's `css-variables` theme plus an in-repo transformer (`src/markdown/shiki-token-classes.ts`) that turns each token into a class (`token-keyword`, `token-comment`, …) and drops every style attribute. `prose.css` styles those classes from the design tokens in the approved monochrome palette (owner decision, 2026-11-19), so code follows the theme with no extra colours. No fallback was needed. |
| GFM tables, footnotes | Sätteri `features` (GFM on by default). |
| Diagrams | `<Diagram>` MDX component wrapping inline SVG or a static image with caption. No client-side diagram rendering. |
| Reusable components | `Callout`, `Figure`, `Gallery`, `Diagram`, `Meta` in `src/components/content/`, passed to each entry's `<Content components={contentComponents} />` so authors don't import them (`@astrojs/mdx`, which inherits the Sätteri pipeline above). `Figure` renders build-optimized responsive images and mono captions in the spec's `FIG. 01 / ROOTS` form, with `alt` required; `Gallery` takes its figures as a `figures` prop and renders them itself, so each image's `sizes` matches its column; `Diagram` requires `alt` and a `description` text equivalent (design-spec §6) and renders inline SVG or a static image. MDX passes attribute names through unchanged, so inline SVG uses SVG spellings (`stroke-width`, not `strokeWidth`). |
| Overflow | Code blocks and tables wrap in a scroll container with `role="region"`, `tabindex="0"` and an accessible label (`Code: TypeScript`, `Code`, `Table`) so keyboard users can scroll them (design-spec §7). In-repo Sätteri plugin `src/markdown/scroll-regions.ts`. |

**Astro 7 gotchas to remember:** the Rust compiler errors on unclosed tags and no longer fixes invalid nesting (e.g. `<div>` inside `<p>`); `compressHTML` now defaults to `'jsx'`, which can remove spaces between adjacent inline elements (use `{" "}` or set `compressHTML: true`).

## 7. Styling, tokens and fonts

### 7.1 Tokens

`src/styles/tokens.css` implements design-spec §2 exactly, using its token names:

- **Color (themed):** `--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-rule`, `--color-control-border`, `--color-link`, `--color-focus`. Light values on `:root`, dark values redefined per §8.
- **Heritage (unthemed, decorative only):** `--heritage-green`, `--heritage-gold`, `--heritage-black`. Used only by the heritage signature component; never for text, links, states or focus.
- **Type:** fluid `clamp()` scales between the spec's mobile and desktop endpoints (hero 40→64px, page heading 36→48px, section heading 26→32px), body 16–18px, prose 18px/1.75, mono labels 12–14px.
- **Layout:** `--shell-max: 1040px`, `--measure: 680px`, gutters 24px → 48–64px, section spacing 64→96px (fluid), 4-column grid below 768px and 12-column at 768px and above.
- **Shape and motion:** 1px rules, radius 0–4px, transitions 150–250ms, no default shadow. Transitions are removed under `prefers-reduced-motion: reduce`.

Nothing else in the codebase contains a raw color, size or duration value.

**Contrast check (2026-11-18) of the spec's proposed palette:** text 15.8–17.2:1, muted 6.2–8.7:1 and control borders 4.0–4.9:1 on both `bg` and `surface` in both themes, so all meet AA (4.5:1 text, 3:1 controls). `--color-rule` is 1.3–1.8:1 and must stay decorative; it can never be the only boundary of a control or state. Heritage gold on the light background (1.4:1) and heritage black on the dark background (1.2:1) are nearly invisible on their own, so the heritage signature gives black a light keyline in dark mode and gold a subtle dark keyline in light mode (owner decision, 2026-11-18). The palette is approved as final.

### 7.2 Tailwind

`global.css` imports Tailwind v4 and maps tokens into utilities with `@theme inline`, so `bg-bg`, `text-muted`, `font-sans` and so on resolve to the variables and switch with the theme automatically. Tailwind's default palette is reset so off-system colors cannot be used by accident.

### 7.3 Fonts

Astro's built-in Fonts API with `fontProviders.fontsource()` for **Geist** (`--font-geist-sans`) and **Geist Mono** (`--font-geist-mono`). Fonts are downloaded and served from the site's own origin. `<Font preload />` only for the Geist Sans weight used above the fold; optimized fallback metrics are generated to keep CLS low.

## 8. Theme system (FR-09)

- **State:** `localStorage['theme']` is `'light'`, `'dark'`, or absent (= follow system).
- **No flash:** a tiny inline, render-blocking script at the top of `<head>` reads the stored value and sets `data-theme` on `<html>` before first paint. With no stored value it sets nothing.
- **CSS:** dark tokens apply under `[data-theme="dark"]`, and under `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`. `color-scheme` is set accordingly so form controls and scrollbars match.
- **System changes:** while System is selected, the CSS media query applies OS changes live with no script involvement (design-spec §3).
- **Control:** `ThemeControl` offers System, Light and Dark as an explicit three-option selector (e.g. a radio group in a small disclosure) that exposes its accessible name and the selected state, per design-spec §6. It's the only header script.
- **Without JS:** the site follows the OS preference; the control is hidden via a `no-js`/`js` class swap.

### 8.0 Navigation state

- `aria-current="page"` only on the link to the exact current page.
- Interior pages (`/work/[slug]`, `/writing/[slug]`, `/writing/category/*`) mark their parent section visually active with a non-color cue (e.g. underline), without `aria-current="page"`.
- Below 768px, nav links collapse behind a labeled disclosure button; the `dlh.` home link and theme control stay visible. Includes a skip-to-content link as the first focusable element.

### 8.1 Category filtering (FR-05)

Filter chips are plain links to prerendered `/writing/category/[category]` pages: zero JavaScript, shareable URLs, keyboard accessible by default. The all-posts archive remains at `/writing`. See ADR-0002.

## 9. Client-side JavaScript budget

| Feature | Mechanism | Loads |
| --- | --- | --- |
| Theme init | inline script, ~0.3 KB | every page, blocking (intentional) |
| Theme toggle | Astro `<script>` (bundled, deferred) | every page |
| Mobile nav | native `popover` attribute + `<button popovertarget>` (verify expanded state is exposed to screen readers in target browsers; add `aria-expanded` sync if not) | **no JS** |
| Command palette (secondary) | vanilla TS module, imported on first Cmd/Ctrl+K or button click | on demand |
| Search (secondary) | Pagefind JS + index, imported by the palette | on demand |

No UI framework (React, Svelte, etc.) is planned. If the command palette proves complex enough to justify one, that is an ADR-worthy decision requiring approval.

## 10. SEO and metadata (FR-13)

### 10.1 `Seo` component

Rendered by `BaseLayout` from page props: `<title>` (pattern `Page — Daniel Lee Holung`), meta description, canonical URL (from `site` in `astro.config.ts`), Open Graph and Twitter card tags.

### 10.2 Social images

A single default OG image (designed per the spec) at launch, with an optional per-entry `ogImage`. Generated per-article OG images are deferred; they would add a rendering dependency.

### 10.3 Structured data

`lib/json-ld.ts` builds: `Person` + `WebSite` on `/` and `/about`; `BlogPosting` on articles; `CreativeWork` (or `SoftwareSourceCode` when a repo exists) on case studies; `BreadcrumbList` on nested routes. Rendered as `application/ld+json` scripts.

### 10.4 Preventing indexing of previews and drafts

- Drafts are never built in production (§5.5).
- A build-time env var `PUBLIC_SITE_ENV` is `production` only on the production deployment. Any other value adds `<meta name="robots" content="noindex, nofollow">` to every page and writes a disallow-all `robots.txt`.
- Workers Builds shares build variables across branches, so a Workers Builds run of any branch other than `main` (`WORKERS_CI_BRANCH`) is non-indexable even when `PUBLIC_SITE_ENV` is `production` (ADR-0005).
- Production `robots.txt` allows all and points to the sitemap.

## 11. Security and privacy

- **No** cookies, analytics, third-party scripts, forms, or personal-data collection at launch.
- **Content Security Policy:** use Astro's CSP support (`security.csp`, introduced in Astro 6) so inline scripts (theme init) are hashed rather than allowing `'unsafe-inline'`. Confirmed in Astro 7.4 (ticket 02): `security.csp.directives` adds directives beyond `script-src` and `style-src`, and the policy is emitted as a `<meta>` tag, so `frame-ancestors` is ineffective there and framing is blocked by `X-Frame-Options` instead. Astro hashes only the scripts it processes, not `<script is:inline>`, and it places the `<meta>` at the end of `<head>`. An `is:inline` script such as theme init needs its hash supplied (`security.csp.scriptDirective.hashes` or the `Astro.csp` runtime API). A browser test fails on any inline script whose hash is missing from the policy.
- **`public/_headers`** (served natively by Workers static assets): `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (deny camera, mic, geolocation, etc.), `X-Frame-Options: DENY`, and long-lived `Cache-Control: immutable` for `/_astro/*` hashed assets.
- `npm audit` runs in CI; Dependabot (or Renovate) keeps dependencies current.
- No secrets live in the repo; deployment credentials live in Cloudflare/GitHub settings.

## 12. Hosting and deployment

### 12.1 Recommendation: Cloudflare Workers static assets

The build output (`dist/`) is uploaded as a Worker's static assets with **no Worker script and no Astro adapter**, since every route is prerendered.

```jsonc
// wrangler.jsonc (sketch)
{
  "name": "dlh-personal",
  "compatibility_date": "<set at implementation>",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

**Why over Pages:** Cloudflare's compatibility matrix lists Workers with the broader feature set (gradual deployments, rollbacks, observability, serving assets on a path), and it is where new features are landing. A static site needs only what both support.
**Trade-offs:** Workers requires explicit `not_found_handling` (Pages inferred it from `404.html`). Custom domains must be on a Cloudflare-managed zone. Branch-deploy controls are more limited than Pages'.
**If the owner prefers Pages:** nothing in §1–§11 changes. Only §12 does, and the `wrangler.jsonc` becomes unnecessary.

### 12.2 Pipeline

1. **GitHub Actions (on every push and PR):** `npm ci` → `astro check` → unit tests → `astro build` → Pagefind index (once search lands) → Playwright e2e + axe against `astro preview` → `npm audit --audit-level=high`.
2. **Cloudflare Workers Builds**, connected to the GitHub repo, builds and deploys `main` to production and non-`main` branches to preview URLs, with `PUBLIC_SITE_ENV` set as a build variable. Previews stay non-indexable through the branch check in §10.4 (ADR-0005).
3. Branch protection on `main` requires step 1 to pass.

### 12.3 Domain

The custom domain and canonical origin (`site` in `astro.config.ts`) are not yet decided. Sitemap, RSS, canonical URLs and OG tags all depend on it. Until then, `site` holds a clearly marked placeholder origin, and the production deployment ticket is blocked on this decision. The domain must be on a Cloudflare-managed zone (ADR-0001).

## 13. Testing and verification

| Layer | Tool | What it checks |
| --- | --- | --- |
| Types & templates | `astro check` (strictest tsconfig) | `.astro`, `.ts`, content types |
| Content | Zod schemas + duplicate-id check | FR-12 actionable build errors |
| Unit | Node's built-in test runner (`node --test`), no extra framework | `lib/` functions: reading time, grouping by year, draft filtering, JSON-LD |
| End-to-end | Playwright on the built site | every route renders, nav active state, theme persistence and no flash, mobile popover nav, 404, RSS/sitemap validity, drafts absent |
| Accessibility | `@axe-core/playwright` | every route × light/dark × mobile/desktop, WCAG 2.2 AA rules |
| Responsive | Playwright | widths 320, 390, 768, 1024, 1440 (design-spec §7); asserts `documentElement.scrollWidth <= clientWidth` (no horizontal overflow). 200% zoom and text enlargement checked manually |
| Content integrity | Playwright / script over `dist/` | fails on `href="#"`, empty `href`, `TODO`, `lorem`, or `placeholder` strings in production HTML (PRD §11) |
| Performance | Lab check (e.g. Lighthouse) per template before launch | LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms. Lab-only at launch (owner decision); real-user data revisited after launch |
| Manual | checklist per ticket | keyboard-only pass, screen reader spot check, reduced motion, both themes |

Node's built-in test runner keeps unit tests dependency-free; switch to Vitest only if a need appears.

## 14. Dependencies

**Runtime/build:** `astro`, `@astrojs/markdown-satteri` (to pass in-repo plugins to Astro's default processor), `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`, `tailwindcss`, `@tailwindcss/vite`, `sharp`.
**Dev:** `typescript@6`, `@types/node` (types for `node:test` and `process.env` under `astro check`), `@types/hast` (types for the in-repo Markdown plugins), `@astrojs/check`, `@playwright/test`, `@axe-core/playwright`, `wrangler`.
**Secondary (added with their tickets):** `pagefind`.
**Explicitly not used:** UI frameworks, `@tailwindcss/typography`, `reading-time`, rehype/remark plugins, CSS-in-JS, analytics SDKs, any CMS.

## 15. Owner decisions

Resolved 2026-11-18:

| Decision | Outcome | Record |
| --- | --- | --- |
| Hosting | Cloudflare Workers static assets | ADR-0001 |
| Category filter | Prerendered `/writing/category/[category]` routes | ADR-0002 |
| TypeScript version | Pinned to 6.0.x | ADR-0003 |
| Project `status` values | active, maintained, complete, archived | §5.1 |
| Real-user performance data | Lab-only at launch; revisit after launch | §13 |
| Palette | Design-spec §2 values approved as final | design-spec §2 |
| Heritage gold keyline | Subtle dark keyline on gold in light mode | design-spec §1 |

Still open:

- **Custom domain** and canonical origin. Blocks the production deployment ticket only (§12.3).

## 16. Environment prerequisite

The local machine runs Node **22.19.0**, below Astro 7's minimum of **22.23.4**. Upgrade (Node 24 LTS recommended) before the first implementation ticket.
