/**
 * Table of contents for an article or case study (design-spec §4, architecture
 * §6): shown when the entry has three or more `h2`s, unless an article's
 * frontmatter `toc` says otherwise. Lists `h2`s with their `h3`s nested;
 * deeper headings are left out.
 */

import type { MarkdownHeading } from 'astro';

export interface TocLink {
  slug: string;
  text: string;
}

export interface TocItem extends TocLink {
  children: TocLink[];
}

const MIN_SECTIONS = 3;

export function tableOfContents(headings: MarkdownHeading[], toc: boolean | undefined): TocItem[] {
  const sections = headings.filter((heading) => heading.depth === 2).length;
  if (!(toc ?? sections >= MIN_SECTIONS)) return [];

  const items: TocItem[] = [];
  let section: TocItem | undefined;
  for (const { depth, slug, text } of headings) {
    if (depth === 2) {
      section = { slug, text, children: [] };
      items.push(section);
    } else if (depth === 3) {
      if (section) section.children.push({ slug, text });
      else items.push({ slug, text, children: [] });
    }
  }
  return items;
}
