/**
 * The homepage's content selection (PRD FR-02, design-spec §4 `/`). Pass
 * published entries only, so drafts never appear.
 */
import { visibleLinks, type Link, type SiteLinks } from './links.ts';
import { directoryOrder } from './projects.ts';

const SELECTED_WORK_LIMIT = 3;
const RECENT_WRITING_LIMIT = 3;

interface Featurable {
  data: { title: string; year: number; order?: number | undefined; featured: boolean };
}

/** `01 / SELECTED WORK`: up to three featured projects, in `/work`'s order. */
export function selectedWork<T extends Featurable>(projects: readonly T[]): T[] {
  return directoryOrder(projects.filter((project) => project.data.featured)).slice(0, SELECTED_WORK_LIMIT);
}

interface Dated {
  data: { published: Date };
}

/** `02 / RECENT WRITING`: the three newest articles, newest first. */
export function recentWriting<T extends Dated>(articles: readonly T[]): T[] {
  return [...articles]
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime())
    .slice(0, RECENT_WRITING_LIMIT);
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
