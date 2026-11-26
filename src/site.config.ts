/**
 * Site identity: the single source for name, role, navigation and links
 * (architecture §5.4). Typed, so a missing required field is a type error.
 *
 * Contact and professional links start empty and are filled only with values
 * the owner has supplied and approved (PRD FR-10). Components render a link
 * only when its value is set.
 */
import type { Link, SiteLinks } from './lib/links.ts';

export interface SiteConfig {
  /** Full-name wordmark; also the author of every article. */
  name: string;
  /** Lowercase monogram used as the home link. */
  monogram: string;
  /** The concrete title under the homepage wordmark. */
  role: string;
  /** The homepage's document title; other pages use `Page — <name>`. */
  homeTitle: string;
  /** The homepage's meta description. */
  description: string;
  /** The homepage's link-preview (Open Graph and Twitter) description. */
  shareDescription: string;
  /** Canonical origin for canonical URLs, social tags, the sitemap and RSS. */
  origin: string;
  nav: Link[];
  links: SiteLinks;
}

export const site: SiteConfig = {
  name: 'Daniel Lee Holung',
  monogram: 'dlh.',
  // Chosen by the owner after mentor feedback, 2026-11-25. No employer named, by choice.
  role: 'Data Engineer, FinTech',
  homeTitle: 'Daniel Lee Holung — Data Engineer, FinTech',
  description:
    'Daniel Lee Holung — engineer, independent developer and writer. Explore my software projects, technical writing and interests in technology, design and life.',
  shareDescription:
    "An engineer's corner of the internet. Software projects, technical writing and an ongoing exploration of technology and life.",
  // The owner's custom domain (ticket 19, architecture §12.3), attached to the
  // Worker in Cloudflare. www.danielholung.dev redirects here.
  origin: 'https://danielholung.dev',
  nav: [
    { label: 'About', href: '/about' },
    { label: 'Work', href: '/work' },
    { label: 'Writing', href: '/writing' },
    { label: 'Now', href: '/now' },
  ],
  // Supplied and approved by the owner, 2026-11-19 (ticket 18). A link left
  // empty is not shown anywhere on the site.
  links: {
    email: 'danielleeholung@gmail.com',
    github: 'https://github.com/DanXSpace',
    linkedin: 'https://www.linkedin.com/in/daniel-holung-a87236222/',
  },
};
