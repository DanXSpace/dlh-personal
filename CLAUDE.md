# Quiet Precision — Agent Instructions

## Project

This repository contains the personal website of Daniel Lee Holung. It combines a software engineering portfolio, personal blog and personal identity website.

## Sources of truth

Before implementing a feature, review:

- `docs/prd.md`
- `docs/design-spec.md`
- `docs/architecture.md`
- The current development ticket

## Development rules

- Work on exactly one approved ticket at a time.
- Do not implement unrelated features.
- Prefer simple, maintainable solutions.
- Inspect existing code before introducing new components.
- Reuse existing design tokens and components.
- Avoid unnecessary dependencies.
- Keep the website static-first.
- Do not introduce a backend without explicit approval.
- Do not change approved visual design decisions without approval.

## Design rules

The approved design direction is Quiet Precision.

- Monochromatic color palette.
- Japanese minimalist layout principles.
- Spacious, asymmetric compositions.
- Geist Sans and Geist Mono.
- Restrained Jamaican heritage accents.
- System-aware light and dark themes.
- Accessible and responsive layouts.
- No generic portfolio templates.
- No gradients, glassmorphism or unnecessary animation.

## Content integrity

- Never invent professional accomplishments.
- Never invent project metrics or technical achievements.
- Never fabricate personal experiences or published articles.
- Clearly distinguish placeholders from approved content.
- Exclude drafts from production.

## Verification

Before marking a ticket complete:

1. Run relevant type checks.
2. Run appropriate automated tests.
3. Review affected pages in a browser.
4. Check responsive behavior.
5. Verify applicable accessibility requirements.
6. Summarize changes and unresolved issues.

## Completion report

For every completed ticket, report:

- Ticket identifier
- Implementation summary
- Files changed
- Tests performed and results
- Design decisions or deviations
- Remaining issues
- Suggested commit message

Stop after completing the assigned ticket. Do not automatically begin the next ticket.

## Agent skills

### Issue tracker

Issues are local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
