/**
 * Page metadata rules (architecture §10.1, PRD FR-13): the document title
 * pattern and canonical URLs. `Seo.astro` renders them for every page.
 */
import { site } from '../site.config.ts';
import type { JsonLd } from './json-ld.ts';
import type { Link } from './links.ts';
import { withoutTrailingSlash } from './routes.ts';

/** `Page — Daniel Lee Holung`, or the site name alone on the homepage. */
export function documentTitle(title: string | undefined): string {
  return title ? `${title} — ${site.name}` : site.name;
}

/**
 * The absolute URL a page is indexed under. Pages build to `<route>/index.html`,
 * which Cloudflare serves at `<route>/`, so canonical URLs end in a slash.
 * The 404 page stands in for any missing address, so it has none.
 */
export function canonicalUrl(pathname: string, origin: string): string | undefined {
  const route = withoutTrailingSlash(pathname.replace(/(index)?\.html$/, ''));
  if (route === '/404') return undefined;
  return `${withoutTrailingSlash(origin)}${route === '/' ? '' : route}/`;
}

/** An image for link previews; `src` is a site path. */
export interface SocialImage {
  src: string;
  width: number;
  height: number;
  /** Text alternative; left out when the entry provides none. */
  alt?: string | undefined;
}

/** The size link previews are designed for (Open Graph's 1.91:1). */
export const socialImageSize = { width: 1200, height: 630 } as const;

/** The default link-preview image in `public/social/` (architecture §10.2). */
export const defaultSocialImage: SocialImage = { src: '/social/default.png', ...socialImageSize, alt: site.name };

/**
 * Sharing metadata that only entry pages (articles, case studies) provide.
 * Every field is optional; ordinary pages pass none of it.
 */
export interface SeoDetails {
  /** Overrides the default link-preview image. */
  image?: SocialImage;
  /** Marks the page as an Open Graph article with these dates. */
  article?: { published: Date; updated?: Date | undefined };
  /** The BreadcrumbList trail after Home, ending with this page (nested routes). */
  breadcrumbs?: Link[];
  /** Further schema.org nodes, such as a BlogPosting. */
  structuredData?: JsonLd[];
}
