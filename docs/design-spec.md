# Quiet Precision — Design specification

Daniel Lee Holung · Personal website · November 18, 2026

## 1. Art direction

Quiet Precision combines Japanese minimalist composition, an editorial grid, and an understated expression of Jamaican heritage. Use generous whitespace, strong alignment, monochrome photography, and precise typography. The approved choices are a Jamaican landscape hero, spacious layouts, system-default appearance, and the lowercase `dlh.` navigation monogram.

- **Identity** — Use **Daniel Lee Holung** in Geist Sans for the full-name wordmark. Use `dlh.` as the home link and a simplified monogram as the favicon.
- **Tagline** — “Curious about systems. Drawn to simplicity.” (revised 2026-11-20)
- **Heritage signature** — Three small green, gold, and black lines in the identity or footer. Use these colors exclusively for decorative identity details. In dark mode, give the black stripe a light keyline if needed. In light mode, give the gold stripe a subtle dark keyline (approved 2026-11-18).
- **Photography** — Use a legally usable, monochrome Jamaican landscape, with misty Blue Mountains ridgelines as the reference. Preserve the image’s focal point across crops. Use genuine personal photographs and verified product screenshots where available. Use concise figure captions such as `FIG. 01 / ROOTS`.
- **Voice** — Copy is intelligent without being pretentious, confident without boasting, personal without oversharing, and professional without sounding corporate: curious, understated and conversational. Avoid motivational statements, unnecessary adjectives and corporate jargon. Public pages and metadata never name current or previous employers; employment history and qualifications live only in the résumé (approved 2026-11-20).
- **Surfaces** — Use flat backgrounds, thin rules, and understated link treatments. Avoid gradients, glass effects, heavy shadows, excessive rounding, and decorative motion.

## 2. Design tokens

### Color

The approved direction is monochrome with decorative heritage accents. The hex values below were proposed as implementation defaults and approved as final on 2026-11-18. All text and control pairings meet WCAG 2.2 AA in both themes (see `docs/architecture.md` §7.1).

| Semantic token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#FAFAF8` | `#171717` | Page background |
| `--color-surface` | `#F1F1EE` | `#222222` | Code and inset surfaces |
| `--color-text` | `#171717` | `#F4F4F2` | Headings and body |
| `--color-muted` | `#595959` | `#B5B5B5` | Metadata and captions |
| `--color-rule` | `#D6D6D2` | `#414141` | Decorative dividers |
| `--color-control-border` | `#767676` | `#858585` | Functional control boundaries |
| `--color-link` | `#171717` | `#F4F4F2` | Links, with underlines in prose |
| `--color-focus` | `#171717` | `#F4F4F2` | Visible keyboard focus |
| `--color-backdrop` | `--color-bg` at 85% | `--color-bg` at 85% | Dims the page behind a modal dialog (the command palette); derived from `--color-bg` with `color-mix`, so it adds no new colour |

Heritage tokens are `--heritage-green: #009B3A`, `--heritage-gold: #FED100`, and `--heritage-black: #000000`.

### Typography and layout

| Token | Desktop | Mobile |
| --- | --- | --- |
| Hero display | 64px Geist Sans | 40px Geist Sans |
| Page heading | 48px Geist Sans | 36px Geist Sans |
| Section heading | 32px Geist Sans | 26px Geist Sans |
| Body | 16–18px Geist Sans | 16–18px Geist Sans |
| Article prose | 18px / 1.75 Geist Sans | 18px / 1.75 Geist Sans |
| Technical labels and captions | 12–14px Geist Mono | 12–14px Geist Mono |
| Content shell | 1,040px maximum | Fluid |
| Reading column | 680px maximum | Fluid |
| Page gutters | 48–64px | 24px |
| Major section spacing | 96px | 64px |
| Grid | 12 columns | 4 columns |
| Rules and corners | 1px rules and 0–4px radius | Same |
| Motion and elevation | 150–250ms transitions and no default shadow | Same |

Use fluid interpolation for headings and spacing between the endpoints. Centralize semantic tokens so that each template inherits the same appearance.

## 3. Shared shell and appearance

- **Header** — Place `dlh.` at the leading edge, followed by About, Work, Writing, and Now, with a theme control. Interior detail pages keep their parent section visually active. Use `aria-current="page"` on links to the exact current page.
- **Footer** — Include copyright, approved contact and professional links, RSS, and the discreet heritage signature.
- **Themes** — Offer System, Light, and Dark. Follow the operating system on first visit and respond to system changes while System is selected. Persist the visitor’s explicit choice and resolve it before first paint. Apply equivalent hierarchy, states, and contrast in both themes.
- **Interactions** — Use restrained underline and state transitions. Keep controls and links identifiable with keyboard, touch, or pointer input. Use text labels for icon-only controls in the accessibility tree.

## 4. Page layouts

| Route | Composition |
| --- | --- |
| `/` | Asymmetrical hero with the role label `ENGINEER / DEVELOPER`, “Daniel Lee Holung.”, the approved tagline, introduction, and monochrome Jamaican landscape with figure caption. Pair “Explore my work” with secondary GitHub and Résumé links. Follow with `01 / SELECTED WORK` (a one-sentence introduction, one to three featured projects and a Work link), `02 / RECENT WRITING` (a one-line introduction, up to three newest published articles and an archive link), and `03 / IN THE PRESENT` (short Now summary and a “What I’m doing now” link). |
| `/about` | “A little about me.” Pair the opener with a portrait and caption. Follow with “Roots.” (Jamaican and Chinese heritage with landscape imagery), “Away from the keyboard.” (a short introduction and personal interests with optional photo tiles), and “Let’s talk.” (a contact invitation). Cover economics, the move from finance into engineering, the general shape of the owner’s work and interests using owner-reviewed copy. No career timeline: employment history lives in the résumé (revised 2026-11-20). |
| `/work` | “Things I’ve built.” with a short introduction. Use a vertical catalogue with thin rules and optional type filters when useful. Each row supports a thumbnail, title, description, year, type, technology stack, status, and a case-study link where available. The catalogue must feel complete with a single project. |
| `/work/[slug]` | Back to Work, case-study label, project title, an optional deck (the summary when there is none), project metadata, and a wide verified image where available. Use a reading column for the problem, goals, architecture, decisions and trade-offs, implementation, validation, and lessons. Support anchored contents, diagrams, code, galleries, and relevant repository, product, or writing links. |
| `/writing` | “Writing.” with the deck “Thinking in public.” and a short introduction (the full archive only). Use reverse-chronological editorial rows grouped by year, with title, publication date, and optional category and reading time. Offer category filtering and RSS access. Full-text search and the command palette are secondary. |
| `/writing/[slug]` | Show category and date, title, optional deck, author, reading time, and optional updated date. Use the 680px reading column. Support anchored headings, optional contents, images with captions, diagrams, code, tables, quotes, and related work when available. |
| `/now` | “Now.” Show the last-updated date and a short introduction. Stack available sections for Building, Learning, Exploring, Training, and Listening, then the closing line “This page changes as my interests and priorities change.” |
| `/resume` and custom 404 | Use the shared visual language. Provide clear access to the résumé and a clear route back to Home from the 404. |

Numbering is reserved for the editorial section labels, case-study indexing, and figure captions. Omit empty lists and unavailable links. Replace preview images and sample writing with approved content before launch.

## 5. Responsive behavior

The breakpoints and column spans below are implementation defaults added to make the approved layout testable.

- **320–767px** — Use four columns and 24px gutters. Stack hero copy and actions before the image and caption. Stack project rows, article metadata, and About imagery. Keep the home link and theme control reachable when navigation collapses behind a labeled disclosure.
- **768–1023px** — Use the 12-column grid with 48px gutters. Pair text and imagery when both remain comfortably readable. Let rows and navigation labels wrap where necessary.
- **1024px and up** — Center the 1,040px shell with 48–64px minimum gutters. Start with a 7/5 hero split and maintain the 680px reading measure. Let wide case-study figures use the content shell.
- Reserve image dimensions to prevent layout shifts and serve responsive image sizes. Allow code blocks and wide tables to scroll inside their own containers. Keep body copy, navigation, and the page itself free of horizontal scroll.

## 6. Accessibility

Target **WCAG 2.2 AA** in light and dark themes.

- Use semantic landmarks, a skip-to-content link, one primary heading per page, and a logical heading and focus order that follows the layout.
- Provide at least 4.5:1 contrast for regular text and 3:1 for large text and functional control boundaries or indicators where required. Use visible focus rings with spacing from the component, and keep focused elements unobscured.
- Use 44 × 44 CSS px as the design target for standalone interactive controls. Provide non-color cues for link, active, and selected states.
- Give meaningful images context-appropriate alt text and use empty alt text for purely decorative imagery. Supply a text equivalent for information conveyed by complex diagrams.
- Ensure the navigation disclosure and theme selector expose accessible names and state. If the secondary command palette ships, support keyboard operation, Escape dismissal, and focus restoration.
- Honor `prefers-reduced-motion` by removing nonessential transitions and smooth scrolling. Ensure text remains readable and controls usable under zoom and text enlargement.

## 7. Acceptance criteria

- [ ] The shell, color roles, typography, grid, and spacing are consistent on every listed page and in both themes.
- [ ] The homepage uses the approved monogram, tagline, asymmetrical composition, monochrome Jamaican landscape, and Selected Work → Recent Writing → In the Present order.
- [ ] Supported templates have been reviewed at 320px, 390px, 768px, 1024px, and 1440px, plus at 200% zoom and a 320 CSS px reflow width. There is no clipping, overlap, or page-level horizontal scrolling.
- [ ] The Work directory works with one project. The Writing archive groups published entries by year and shows the most recent first. Long titles and metadata wrap without covering links or controls.
- [ ] The first visit follows the system theme, switching modes updates the full page, and explicit choices survive reload and navigation without a visible theme flash.
- [ ] Keyboard-only testing covers the skip link, navigation, theme selection, filters, reading links, and any optional search. Manual screen-reader checks confirm landmarks, headings, and interactive names and states. Automated accessibility and manual contrast checks pass in both themes.
- [ ] Reduced-motion behavior works, figure captions and alt text are present as appropriate, and code and table overflow is usable by keyboard.
- [ ] Production pages use rights-cleared imagery, verified project details, owner-approved biography and contact details, and working links. Preview assets and drafts are excluded.
