/**
 * Structured data (architecture §10.3, PRD FR-13): schema.org nodes for the
 * person and website, articles, case studies and breadcrumb trails. URLs are
 * canonical and absolute. Every value comes from site config or an entry's
 * frontmatter, so nothing here can invent a claim.
 */
import { site } from '../site.config.ts';
import type { Link } from './links.ts';
import { withoutTrailingSlash } from './routes.ts';
import { canonicalUrl } from './seo.ts';

export type JsonLd = Record<string, unknown>;

/** Pages that describe the person and the website (architecture §10.3). */
const identityRoutes = new Set(['/', '/about']);

const home = (origin: string) => `${withoutTrailingSlash(origin)}/`;
const personId = (origin: string) => `${home(origin)}#person`;
const absolute = (path: string, origin: string) => new URL(path, origin).href;
const page = (path: string, origin: string) => canonicalUrl(path, origin) ?? absolute(path, origin);

function author(origin: string): JsonLd {
  return { '@type': 'Person', '@id': personId(origin), name: site.name, url: home(origin) };
}

/**
 * `Person` and `WebSite` on the homepage and About page; nothing elsewhere.
 * `sameAs` holds approved profile URLs only, and is left out while there are none.
 */
export function identityNodes(pathname: string, origin: string, profiles: string[]): JsonLd[] {
  if (!identityRoutes.has(withoutTrailingSlash(pathname))) return [];
  return [
    { ...author(origin), ...(profiles.length > 0 && { sameAs: profiles }) },
    {
      '@type': 'WebSite',
      '@id': `${home(origin)}#website`,
      name: site.name,
      url: home(origin),
      author: { '@id': personId(origin) },
    },
  ];
}

export interface ArticleData {
  title: string;
  description: string;
  published: Date;
  updated?: Date | undefined;
  /** The article's path. */
  path: string;
  /** The social image's path or URL. */
  image: string;
}

export function blogPosting(article: ArticleData, origin: string): JsonLd {
  const url = page(article.path, origin);
  return {
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.published.toISOString(),
    dateModified: (article.updated ?? article.published).toISOString(),
    url,
    mainEntityOfPage: url,
    image: absolute(article.image, origin),
    author: author(origin),
  };
}

export interface CaseStudyData {
  title: string;
  summary: string;
  path: string;
  image: string;
  repo?: string | undefined;
}

/** `SoftwareSourceCode` when the project has a repository, `CreativeWork` otherwise. */
export function caseStudy(project: CaseStudyData, origin: string): JsonLd {
  return {
    '@type': project.repo ? 'SoftwareSourceCode' : 'CreativeWork',
    name: project.title,
    description: project.summary,
    url: page(project.path, origin),
    image: absolute(project.image, origin),
    ...(project.repo && { codeRepository: project.repo }),
    author: author(origin),
  };
}

/** A trail from Home through `steps`, the last of which is the current page. */
export function breadcrumbList(steps: Link[], origin: string): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ label: 'Home', href: '/' }, ...steps].map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.label,
      item: page(step.href, origin),
    })),
  };
}

/**
 * The body of an `application/ld+json` script: one schema.org graph. `<` is
 * escaped so no value can close the script element early.
 */
export function jsonLdScript(nodes: JsonLd[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
}
