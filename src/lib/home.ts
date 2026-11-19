/**
 * The homepage's content selection (PRD FR-02, design-spec §4 `/`). Pass
 * published entries only, so drafts never appear.
 */
import { newestFirst, type Dated } from './archive.ts';
import { visibleLinks, type Link, type SiteLinks } from './links.ts';
import { directoryOrder, type Orderable } from './projects.ts';

const SELECTED_WORK_LIMIT = 3;
const RECENT_WRITING_LIMIT = 3;

type Featurable = Orderable & { data: { featured: boolean } };

/** Selected work: up to three featured projects, in `/work`'s order. */
export function selectedWork<T extends Featurable>(projects: readonly T[]): T[] {
  return directoryOrder(projects.filter((project) => project.data.featured)).slice(0, SELECTED_WORK_LIMIT);
}

/** Recent writing: the three newest articles, newest first. */
export function recentWriting<T extends Dated>(articles: readonly T[]): T[] {
  return newestFirst(articles).slice(0, RECENT_WRITING_LIMIT);
}

/**
 * The numbers in the sections' labels (`01 / SELECTED WORK`). `shown` lists
 * every section in page order, each with whether it has anything to show.
 * Shown sections are numbered from 1 in that order and the rest get none, so a
 * section left out never leaves a gap, as with About's figures.
 */
export function sectionNumbers<K extends string>(shown: Record<K, boolean>): Partial<Record<K, number>> {
  let count = 0;
  const numbers: Partial<Record<K, number>> = {};
  for (const [section, isShown] of Object.entries(shown) as [K, boolean][]) {
    if (isShown) numbers[section] = ++count;
  }
  return numbers;
}

export interface HeroActions {
  /** “Explore my work”, once `/work` has a project to show. */
  primary: Link | undefined;
  /** GitHub and the résumé, each only when available. */
  secondary: Link[];
}

/**
 * The hero's calls to action. Each renders only when it leads somewhere
 * (design-spec §4: "Omit empty lists and unavailable links"): `resume` is
 * `resumeLinks(siteResumeAccess())`, so it follows the résumé rule.
 */
export function heroActions({
  hasProjects,
  links,
  resume,
}: {
  hasProjects: boolean;
  links: SiteLinks;
  resume: Link[];
}): HeroActions {
  return {
    primary: hasProjects ? { label: 'Explore my work', href: '/work' } : undefined,
    secondary: [...visibleLinks(links, 'code'), ...resume],
  };
}
