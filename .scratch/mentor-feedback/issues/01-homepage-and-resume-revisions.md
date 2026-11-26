# 01 — Homepage and résumé revisions from mentor feedback

Status: ready-for-agent
Type: task

## Source

Mentor review (2026-11-25), talked through with the owner, who approved every change below.

## Changes

1. **Hero says who I am.** The line under the wordmark reads `Data Engineer, FinTech` (no employer, owner's choice). It replaces the tagline in the hero; the small `Engineer / Developer` label goes, since it said the same thing less precisely.
2. ~~**No hero photo on mobile.** Below 1024px the landscape figure is hidden, so the reader goes from the introduction straight to the work.~~ Superseded: see Comments (3:1 strip below 1024px). From 1024px the two-column hero is unchanged.
3. **Selected work leads.** The homepage project rows match `/work`: thumbnail, title, summary, year, type, status and stack. Every featured project has a thumbnail from its existing case-study screenshots. The Selected work section label is larger, so the work draws the eye after the bio.
4. **Three projects on the homepage.** LiftDay, Apartment Hunter, and this website as a new project. The website entry stays `draft: true` (visible in `npm run dev`, left out of production) until the owner approves its copy. `/work` stays as the full archive.
5. **Résumé opens in the browser.** `/resume` shows the PDF inline, with a link to open it in a new tab and a download link. `public/resume.pdf` is replaced with `~/Documents/Job Related/DHolungResume_SWE.pdf`.

## Out of scope

- Writing articles (the owner writes them).
- Pushing or opening a PR: the owner reviews on localhost first.

## Design deviations (approved by the owner)

- Tagline and role label replaced by a concrete title.
- ~~Hero image hidden below 1024px.~~ Superseded by a 3:1 strip below 1024px (see Comments).
- ~~Larger Selected work label than the other section labels.~~ Superseded: all section labels match (see Comments).

## Comments

**2026-11-26 — design-philosophy pass (approved by the owner).** Some items above were revised to keep Quiet Precision:

- Item 1: the title is set in Geist Mono at body-large size under the wordmark, not in sans at section-heading size.
- Item 2: below 1024px the landscape isn't hidden. It shows as a 3:1 strip under the calls to action, with its caption.
- Item 3: Selected work keeps the same mono `01 / …` label as the other sections. It stands out through its rows, not a larger label.
- Item 5: hero, footer and palette links go to `/resume`. That page has a download link and an open-in-new-tab link, and from 768px it shows the PDF inline in a framed viewer. `public/_headers` gives `/resume.pdf` `frame-ancestors 'self'` so the same-origin frame works despite the site-wide `X-Frame-Options: DENY`.
- Docs (design spec, PRD, architecture) and e2e tests are updated to match.

**2026-11-26 — `/interrogate` fixes.**

- Draft images no longer ship: the `draft-assets` build step (`src/lib/draft-assets.ts`) removes them, with unit tests and a production-build check.
- Thumbnail alt text for LiftDay and Apartment Hunter now describes the 4:3 crop that rows show.
- `public/resume.pdf`: the phone number is removed at the owner's request, and the PDF title is "Daniel Holung Résumé". The edit was made to the approved PDF, so the owner's Drive source (`DHolungResume_SWE.docx`) still has the phone number.
- `tests/e2e/home.spec.ts` checks the title instead of the removed tagline.
