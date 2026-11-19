/**
 * The About page's contact invitation (PRD FR-07, design-spec §4 `/about`).
 */
import { visibleLinks, type Link, type SiteLinks } from './links.ts';

export interface ContactInvitation {
  /** The invitation sentence from the About entry, if it has one. */
  text: string | undefined;
  links: Link[];
}

/**
 * The invitation offers only the links set in site config, never a link from
 * content, and is omitted while none are set (PRD FR-10).
 */
export function contactInvitation(links: SiteLinks, text: string | undefined): ContactInvitation | undefined {
  const visible = visibleLinks(links);
  return visible.length === 0 ? undefined : { text, links: visible };
}
