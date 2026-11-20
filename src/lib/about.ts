/**
 * The About page's contact invitation (PRD FR-07, design-spec §4 `/about`).
 */
import { visibleLinks, type Link, type SiteLinks } from './links.ts';

export interface ContactInvitation {
  /** The invitation's paragraphs from the About entry; empty when it has none. */
  paragraphs: string[];
  links: Link[];
}

/**
 * The invitation offers only the links set in site config, never a link from
 * content, and is omitted while none are set (PRD FR-10). Like the footer, it
 * offers every kind of link (`links.ts`), profiles as well as contact channels.
 */
export function contactInvitation(
  links: SiteLinks,
  text: string | string[] | undefined,
): ContactInvitation | undefined {
  const visible = visibleLinks(links);
  if (visible.length === 0) return undefined;
  const paragraphs = text === undefined ? [] : typeof text === 'string' ? [text] : text;
  return { paragraphs, links: visible };
}
