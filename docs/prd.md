# Product Requirements Document
## Daniel Lee Holung — Personal Website

**Version:** 1.0  
**Design system:** Quiet Precision  
**Date:** November 18, 2026  
**Status:** Ready for implementation planning

## 1. Product overview

Develop a fast, accessible, minimalist personal website that combines a professional software engineering portfolio with a personal blog and a living record of personal interests, ongoing projects and intellectual growth.

The website must reflect engineering precision, Japanese minimalist design principles and Jamaican heritage.

It must communicate technical competence to prospective employers while remaining authentic and approachable to readers and collaborators.

## 2. Product objectives

- Establish a permanent, recognizable personal identity on the internet.
- Showcase software engineering projects through substantive technical case studies.
- Demonstrate engineering judgment, problem-solving and technical communication.
- Publish technical articles, development logs and personal essays.
- Create opportunities for employment, collaboration and professional networking.
- Make content publishing and website maintenance straightforward.
- Support long-term expansion without requiring architectural redesign.

## 3. Target audiences

**Recruiters and hiring managers:** Need to understand the owner's experience, capabilities, projects and contact information quickly.

**Software engineers:** Want to explore technical decisions, architecture, code and engineering perspectives.

**Potential collaborators:** Want to understand interests, expertise and opportunities to work together.

**General readers:** Want to discover useful articles, personal perspectives and interesting projects.

## 4. User experience principles

- Content takes precedence over decoration.
- Visitors can discover projects, professional information and writing without unnecessary navigation.
- The experience is equally usable with a keyboard, mouse or touchscreen.
- Pages remain readable and functional without unnecessary client-side JavaScript.
- The website feels consistent across devices and color themes.
- Personal identity is expressed authentically rather than through generic portfolio conventions.

## 5. Information architecture

Primary routes:

- `/` — Homepage
- `/about` — Personal and professional background
- `/work` — Project directory
- `/work/[slug]` — Individual project case study
- `/writing` — Blog archive
- `/writing/[slug]` — Individual article
- `/now` — Current activities and interests

Supporting routes and resources:

- `/resume` — Résumé access
- `/rss.xml` — RSS feed
- `/sitemap.xml` — Search engine sitemap
- Custom 404 page

Navigation must remain limited to About, Work, Writing and Now, with the dlh. monogram linking to the homepage.

Professional links and contact details must be accessible from the homepage and footer.

## 6. Functional requirements

### FR-01 — Global website shell

Provide a shared header, primary navigation, main content region and footer.

The header must include the dlh. monogram, navigation links and theme control.

The footer must include copyright information, contact information, professional links and RSS access.

Provide active navigation indicators, visible keyboard focus states and a responsive mobile navigation menu.

### FR-02 — Homepage

The homepage must include:

1. An asymmetrical hero containing the owner's full name, title, short introduction and monochrome Jamaican landscape photography.
2. A primary link to the project directory.
3. GitHub and résumé links, plus accessible contact information.
4. A selected work section displaying one to three featured projects.
5. A recent writing section displaying the three newest published articles.
6. A short summary of the current Now page.
7. Global footer.

Featured projects and recent articles must be populated automatically from their respective content collections.

### FR-03 — Project directory

Display published projects in a vertically arranged catalogue.

Each project entry must support:

- Project title
- Short description
- Thumbnail
- Technology stack
- Project status
- Project type
- Year
- Case study link

Projects may be categorized as applications, experiments or other software projects.

The directory must support a single project at launch without appearing unfinished.

### FR-04 — Project case studies

Each case study must support:

- Project overview
- Problem statement
- Product objectives
- Screenshots and demonstrations
- Technology stack
- Technical architecture
- Engineering decisions and trade-offs
- Implementation challenges
- Testing and validation
- Lessons learned
- Repository and product links, when available
- Related articles and development logs

Support reusable content components for diagrams, code blocks, image galleries, callouts and metadata.

Only verified project details should be published. Never represent conceptual architecture or placeholder screenshots as implemented functionality.

### FR-05 — Writing archive

Display all published articles in reverse chronological order, grouped by year.

Each entry must show the title, publication date and optionally category and estimated reading time.

Supported categories:

- Engineering
- Build logs
- Learning
- Technology
- Life

The archive must support category filtering. Full-text search is a secondary feature.

### FR-06 — Article pages

Articles must support Markdown and MDX content.

The article template must support headings, paragraphs, lists, links, images, captions, tables, blockquotes, syntax-highlighted code, diagrams and embedded reusable components.

Include publication date, optional updated date, author, category and calculated reading time.

Include heading anchors and a table of contents where appropriate.

Draft articles must be excluded from production builds, navigation, RSS and search.

### FR-07 — About page

Present the owner's personal story, including:

- Background in economics
- Transition from finance into technology
- The general shape of their professional background, without naming employers
- Jamaican and Chinese heritage
- Personal interests
- Current interests and direction
- Opportunities to connect

Support portrait photography and landscape photography. Detailed employment history and professional qualifications live only in the résumé, which is their source of truth; public pages and metadata do not name current or previous employers (revised 2026-11-20).

All biographical content must be reviewed by the owner before publication.

### FR-08 — Now page

Provide a periodically updated snapshot of current activities.

Support sections for building, learning, exploring, training and listening.

Display the date the page was last updated.

Historical archives of previous updates are outside the initial launch scope.

### FR-09 — Appearance system

Support light mode, dark mode and system preference.

The first visit must follow the operating system preference.

A manually selected theme must persist across sessions.

The website must avoid unnecessary color-theme flashes during initial rendering.

All templates and content components must support both themes.

### FR-10 — Contact and résumé

Provide direct access to email, GitHub, LinkedIn and a résumé.

The résumé may be a downloadable PDF hosted with the website.

No contact form, account creation or backend messaging system is required for launch.

Do not publish personal contact information until explicitly supplied and approved by the owner.

### FR-11 — Search and command palette

Secondary requirement.

Provide an optional command palette accessible through Cmd+K or Ctrl+K.

Support searching published articles, projects and page navigation.

Provide keyboard navigation, screen-reader support, Escape dismissal and correct focus restoration.

Traditional navigation must remain fully functional without the command palette.

### FR-12 — Content publishing

Content must be editable through Markdown or MDX files stored in the project repository.

Publishing must not require modifications to application components.

Content should be validated at build time against defined schemas.

Invalid metadata, duplicate slugs and missing required fields should cause actionable build errors.

### FR-13 — SEO and social sharing

Every published page must provide an appropriate page title, meta description and canonical URL.

Provide Open Graph metadata, social sharing images, sitemap generation and RSS.

Use appropriate structured data for personal information, articles and other applicable content.

Unpublished drafts and preview deployments must not be indexed.

## 7. Content and design requirements

Apply the approved Quiet Precision visual specification consistently throughout the website.

Use Geist Sans and Geist Mono, monochromatic color tokens, generous whitespace, asymmetric layouts and restrained visual interactions.

The hero image must feature a legally usable monochrome Jamaican landscape.

Avoid gradients, glassmorphism, heavy shadows, excessive rounding, unnecessary animation and generic AI-generated portfolio imagery.

Use actual project screenshots and personal photographs when available.

Preserve readable typography, appropriate contrast and visible focus indicators in both color schemes.

## 8. Non-functional requirements

### Performance

- Target an LCP of 2.5 seconds or less.
- Target a CLS of 0.1 or less.
- Target an INP of 200 milliseconds or less.
- Optimize and appropriately size images.
- Minimize client-side JavaScript.
- Self-host and optimize fonts where practical.

Core Web Vitals targets should be evaluated at the 75th percentile when sufficient real-user data becomes available.

### Accessibility

Target WCAG 2.2 Level AA.

Support semantic HTML, meaningful alternative text, keyboard navigation, appropriate contrast, reduced-motion preferences and accessible interactive controls.

Automated accessibility checks must be supplemented with manual testing.

### Responsiveness

Support mobile, tablet, laptop and desktop layouts, including viewport widths from 320px upward.

No unintended horizontal overflow.

Code blocks and wide tables must handle overflow independently.

### Maintainability

Use reusable templates and components.

Keep visual tokens centralized.

Use strict TypeScript and content schema validation.

Document setup, publishing, testing and deployment.

Avoid introducing dependencies without a clear requirement.

### Security and privacy

Do not introduce authentication, payment processing or personal-data collection.

Do not expose credentials or unpublished content.

Use minimal third-party scripts.

Apply suitable security headers and review dependencies.

## 9. Proposed technical architecture

- Framework: Astro
- Language: TypeScript
- Styling: CSS custom properties and Tailwind CSS
- Content: Astro content collections with Markdown and MDX
- Search: Static search index, such as Pagefind
- Hosting: Cloudflare Pages
- Version control: Git and GitHub
- CI/CD: Automated validation, testing and deployment
- Browser testing: Playwright
- Accessibility testing: axe-core and manual checks

The architecture must remain static-first. Client-side components should be introduced only where interactive functionality requires them.

Validate current framework versions and integration compatibility before implementation.

## 10. MVP launch scope

Required:

- Global navigation and footer
- Responsive homepage
- About page
- Project directory
- Reusable project case study template
- Blog archive and article template
- Now page
- Markdown/MDX content publishing
- Light and dark appearance
- Contact and résumé access
- SEO metadata, sitemap and RSS
- Accessibility and performance testing
- Production deployment

Secondary:

- Full-text search
- Command palette
- Related project development logs

Deferred:

- Guestbook
- Music service integration
- Digital bookshelf
- Website changelog
- Historical Now archive
- Newsletter
- Analytics dashboard
- CMS administration interface

## 11. Success criteria

The website is successful when:

- An employer can identify the owner's professional identity, projects and contact information without difficulty.
- At least one substantial project case study is published.
- The owner can publish an article without editing application code.
- The same design system is consistently applied across all pages.
- Core navigation and content are accessible with a keyboard.
- All published pages render correctly across supported viewport sizes.
- The website is deployed to a custom domain over HTTPS.
- No placeholder links, misleading project information or unintended draft content remains in production.
- The owner is comfortable sharing the website with prospective employers and collaborators.

## 12. Development workflow

Implement one approved feature or ticket at a time.

For every ticket:

1. Review the PRD and relevant design requirements.
2. Define acceptance criteria and scope.
3. Implement the smallest complete solution.
4. Run relevant automated and manual tests.
5. Review the implementation and visual result.
6. Update documentation where necessary.
7. Commit the completed feature.

Coding agents must not introduce unrelated features, change approved visual decisions or add unnecessary architectural complexity without explicit approval.

## 13. Release approval

Before production launch, verify all personal content, images, professional links, project details, accessibility requirements and deployment configuration.

The owner must approve the final website before publication.
