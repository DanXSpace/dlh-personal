# 02 — Case study for this website

Status: needs-triage
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
