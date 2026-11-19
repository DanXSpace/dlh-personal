# Daniel Lee Holung — personal site

A static Astro site: portfolio, writing and personal identity. Product, design and
architecture decisions live in [`docs/`](docs/) (`prd.md`, `design-spec.md`,
`architecture.md`, and decision records in `docs/adr/`).

## Requirements

- Node.js 24 LTS (minimum 22.23.4, required by Astro 7). `.nvmrc` pins it: run `nvm use`.
- npm 10 or newer.

## Setup

```sh
nvm use
npm ci
npx playwright install chromium   # browser for the end-to-end and accessibility tests
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server at `http://localhost:4321`. |
| `npm run build` | Build the static site into `dist/`. |
| `npm run preview` | Serve the built `dist/` locally. |
| `npm run check` | Type-check `.astro` and `.ts` files with `astro check` (strictest tsconfig). |
| `npm run test:unit` | Run unit tests in `tests/unit/` with Node's built-in test runner. |
| `npm run test:e2e` | Run Playwright browser and axe accessibility tests against the built site. Run `npm run build` first. |
| `npm run verify` | Run the type check, unit tests, build and browser tests in that order. Exits non-zero if any step fails. |

Run `npm run verify` before every commit.

## Tests

- `tests/unit/`: pure functions in `src/lib/`, run directly by Node (native TypeScript type stripping, no test framework).
- `tests/e2e/`: Playwright against `astro preview` of the production build, including responsive overflow checks.
- `tests/a11y/`: axe-core checks against WCAG 2.2 AA rules.

### Fixture content

Template tests will use fixture entries in `tests/fixtures/content/`, which never ship.
`CONTENT_SOURCE=fixtures npm run build` writes to `dist-fixtures/` instead of `dist/`.
Content collections don't exist yet. When they're added, their loaders read from the
fixtures directory in that mode. The production build reads only `src/content/` and
writes `dist/`. See [ADR-0004](docs/adr/0004-fixture-content-via-separate-build.md).
