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

/** Render order, label and href for each field. */
const fields: { key: keyof SiteLinks; label: string; toHref: (value: string) => string }[] = [
  { key: 'email', label: 'Email', toHref: (address) => `mailto:${address}` },
  { key: 'github', label: 'GitHub', toHref: (url) => url },
  { key: 'linkedin', label: 'LinkedIn', toHref: (url) => url },
];

export function visibleLinks(links: SiteLinks): Link[] {
  return fields.flatMap(({ key, label, toHref }) => {
    const value = links[key].trim();
    return value === '' ? [] : [{ label, href: toHref(value) }];
  });
}
