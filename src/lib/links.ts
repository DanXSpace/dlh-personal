/**
 * Contact and professional links (architecture §5.4, PRD FR-10).
 *
 * Every field starts empty and is filled only with owner-approved values. A
 * link renders only when its value is set, so nothing placeholder-shaped can
 * reach a page.
 */
export interface SiteLinks {
  /** Email address, without `mailto:`. */
  email: string;
  /** Full GitHub profile URL. */
  github: string;
  /** Full LinkedIn profile URL. */
  linkedin: string;
}

/** A labeled link, as rendered in the navigation, footer and elsewhere. */
export interface Link {
  label: string;
  href: string;
}

/**
 * What a link is for (PRD FR-10). Each caller asks for the kinds it means, so
 * the table below is the one place that says which link is which. A link can
 * be more than one kind.
 * - `contact`: a channel a visitor can send a message through.
 * - `profile`: a public page about the owner (schema.org `sameAs`).
 * - `code`: where the owner's code is published.
 */
export type LinkKind = 'contact' | 'profile' | 'code';

/** Render order, label, href and kinds for each field. */
const fields: {
  key: keyof SiteLinks;
  label: string;
  toHref: (value: string) => string;
  kinds: readonly LinkKind[];
}[] = [
  { key: 'email', label: 'Email', toHref: (address) => `mailto:${address}`, kinds: ['contact'] },
  { key: 'github', label: 'GitHub', toHref: (url) => url, kinds: ['profile', 'code'] },
  { key: 'linkedin', label: 'LinkedIn', toHref: (url) => url, kinds: ['contact', 'profile'] },
];

/** The links that are set, in render order: all of them, or only those of `kind`. */
export function visibleLinks(links: SiteLinks, kind?: LinkKind): Link[] {
  return fields.flatMap(({ key, label, toHref, kinds }) => {
    const value = links[key].trim();
    if (value === '' || (kind !== undefined && !kinds.includes(kind))) return [];
    return [{ label, href: toHref(value) }];
  });
}
