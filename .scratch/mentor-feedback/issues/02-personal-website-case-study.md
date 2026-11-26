# 02 — Case study for this website

Status: resolved
Type: task
Blocked by: 01

## Source

Mentor feedback (2026-11-25) added this website to Selected work. Ticket 01 created `src/content/projects/personal-website/` as a `draft: true` placeholder. This ticket replaces the placeholder with a full case study, the same way the LiftDay (PR #13) and Apartment Hunter (PR #15, #17) case studies were written.

## Goal

A published case study at `/work/personal-website` that matches the other two in structure, depth and visual treatment, built only from verified facts.

## Scope

1. **Body.** Follow the case-study sections in design-spec §4 `/work/[slug]`: problem, goals, architecture, decisions and trade-offs, implementation, validation, lessons. The Apartment Hunter entry is the closest model (idea, how it works, how it's built, decisions worth explaining, testing and validation, how I build, trade-offs, current status).
2. **Sources of fact.** Draw only on this repo: `docs/prd.md`, `docs/design-spec.md`, `docs/architecture.md`, `docs/adr/0001`–`0005`, `package.json`, `astro.config.ts`, `public/_headers`, the test suites and git history. Candidate decisions worth explaining:
   - static-first on Cloudflare Workers static assets (ADR-0001)
   - writing category filters as static routes (ADR-0002)
   - fixture content in a separate build (ADR-0004)
   - preview deploys kept out of search engines by branch (ADR-0005)
   - a Content Security Policy with hashed inline scripts
   - Pagefind search loaded on first query
   - the design-token test that blocks raw values
   - the Quiet Precision design direction
3. **Diagrams.** At least one inline SVG diagram in the monochrome tokens (for example, content source → Astro build → Workers static assets, with the fixture build beside it). It needs a stacked drawing for phones and a text description, like `ApartmentHunterArchitecture.astro`.
4. **Images.** Verified screenshots of the live site in light and dark, captured fresh. They replace `homepage.png` as the thumbnail if better. Record each one in `docs/asset-rights.md`.
5. **Frontmatter.** Review `summary`, `deck` and `role`, which are agent drafts from ticket 01 (for example, "designed and tested in the open" needs the owner's confirmation). Remove `draft: true` only after the owner approves the copy.
6. **Search.** Update `tests/e2e/search.spec.ts` if the indexed case-study count is asserted, as the Apartment Hunter PR did.

## Needs the owner

- Why the site was built, and what the owner wanted it to say. Motivation and lessons can't be inferred from the repo.
- Approval of every sentence before `draft: true` comes off (content integrity: no invented accomplishments or metrics).

## Out of scope

- Changes to the site's design or code beyond what the case study needs (a new diagram component is in scope).

## Acceptance

- `/work/personal-website` renders in production with no placeholder text.
- Every claim traces to the repo or to the owner.
- `npm run verify` passes. The page has been checked at 320px, 768px and 1440px in both themes.

## Comments

**2026-11-26:** The owner answered the motivation, goals, workflow and lessons questions. A full draft of the body and the `PersonalWebsiteBuild` diagram is on `feat/personal-website-case-study`, and it stays `draft: true`. Role changed to "Independent developer" because the owner said "Designer and developer" isn't accurate. The summary now uses the owner's wording, and the repo is confirmed public. Still to do: the owner's line-by-line approval, fresh light and dark screenshots with matching `asset-rights.md` entries, then removing `draft: true`.

**2026-11-26:** The owner approved the copy, and `draft: true` is removed. Light and dark homepage screenshots are captured from the production build, and `homepage-light.png` replaces `homepage.png` as the thumbnail. Both are recorded in `docs/asset-rights.md`. `npm run verify` passes. The page has been checked at 320, 768 and 1440 px in both themes: no horizontal scroll, no axe violations and no console errors. `tests/e2e/search.spec.ts` needed no change because it counts entries dynamically.

**2026-11-26 (review):** Reviewed on both axes (standards and spec). Fixes: two claims reworded (the token test fails `npm run verify`, and only the draft checks, not placeholder text, run against production), an approval tag added to the design-spec photography line, a reuse note added to the light screenshot's asset-rights row, and the diagram labels defined once.
