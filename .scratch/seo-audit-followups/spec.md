# SEO audit follow-ups

Status: resolved

## Context

An external SEO scan of `https://danielholung.dev/` (2026-11-23) reported eight issues. Each was checked against the live site, the built CSS and HTML, DNS and the docs. Three hold up and are tracked here. The other five were rejected; the reasons are recorded below so the next scan doesn't reopen them.

## Issues

| # | Ticket | Owner | Where the work happens |
| --- | --- | --- | --- |
| 01 | [Turn on search indexing](issues/01-turn-on-search-indexing.md) | human | Cloudflare Workers Builds variables |
| 02 | [Publish SPF and DMARC records](issues/02-publish-spf-and-dmarc-records.md) | human | Cloudflare DNS |
| 03 | [Add raster favicon fallbacks](issues/03-add-raster-favicon-fallbacks.md) | agent | Repo: `public/`, `BaseLayout.astro` |

The three tickets are independent and can ship in any order.

## Rejected findings

| Finding | Why it was rejected |
| --- | --- |
| "Use CSS media queries" (HIGH) | The built CSS has 8 `@media` rules. Tailwind 4 writes them in Media Queries Level 4 range syntax (`(width>=48rem)`), which the scanner doesn't recognise. |
| "Eliminate render-blocking resources" (HIGH) | One 22 KB stylesheet plus the inline theme script, which blocks on purpose to prevent a wrong-theme flash (`BaseLayout.astro`). Inlining the CSS gains too little at this size. |
| "Main keyword in title, description and H1" (HIGH) | "Daniel Lee Holung" appears in all three. The scanner guessed a different keyword. Approved copy stays as it is. |
| "Images at natural aspect ratio" (MEDIUM) | The hero is cropped with `object-fit: cover` (architecture §5), not stretched. |
| "Add Google Analytics" (MEDIUM) | Architecture §11: no cookies, analytics or third-party scripts at launch. Reopen only through an architecture change the owner approves. |
