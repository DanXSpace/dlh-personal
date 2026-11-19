# Test templates against fixture content in a separate build

Templates need realistic entries to test against (long titles, every project `status`, drafts, MDX components), but fixture entries must never reach production, and the owner's real content will be sparse for a while. Fixtures live in `tests/fixtures/content/<collection>/`, mirroring `src/content/`. Setting `CONTENT_SOURCE=fixtures` at build time makes `src/lib/content-source.ts` point collection loaders at that directory and set Astro's `outDir` to `dist-fixtures/`. A production build (the variable unset) reads only `src/content/` and writes `dist/`, the only directory that is deployed. An unrecognised value fails the build instead of quietly falling back. Decided while implementing ticket 01 (walking skeleton), 2026-11-18.

## Consequences

- Collection loaders in `src/content.config.ts` must take their `base` from `resolveContentSource(process.env).contentRoot`, never a hard-coded path.
- Browser tests that need fixtures build with `CONTENT_SOURCE=fixtures` and serve `dist-fixtures/`. Content-integrity checks (no placeholder strings, drafts absent) keep running against the production `dist/`.
- We didn't mark fixtures as drafts: drafts are excluded only when `import.meta.env.PROD` is set, so a draft-based fixture would vanish from the production build that the browser tests run against.
