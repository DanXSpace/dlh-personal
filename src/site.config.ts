/**
 * Site identity: the single source for name, tagline, navigation and links
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
  tagline: string;
  description: string;
  nav: Link[];
  links: SiteLinks;
}

export const site: SiteConfig = {
  name: 'Daniel Lee Holung',
  monogram: 'dlh.',
  tagline: 'Building things. Exploring ideas. Always learning.',
  // Interim wording drawn from the project brief, not owner-approved copy.
  // Replace with the owner's description in ticket 18.
  description: 'Software engineering portfolio and writing by Daniel Lee Holung.',
  nav: [
    { label: 'About', href: '/about' },
    { label: 'Work', href: '/work' },
    { label: 'Writing', href: '/writing' },
    { label: 'Now', href: '/now' },
  ],
  links: {
    email: '',
    github: '',
    linkedin: '',
  },
};
