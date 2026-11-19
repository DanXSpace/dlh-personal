/**
 * Projects (PRD FR-03, FR-04; architecture §5.1). The label maps' keys are the
 * values allowed in frontmatter; the labels are what readers see.
 */
import { newestFirst, type Dated } from './archive.ts';
export const projectStatusLabels = {
  active: 'Active',
  maintained: 'Maintained',
  complete: 'Complete',
  archived: 'Archived',
} as const;

export type ProjectStatus = keyof typeof projectStatusLabels;

export const projectStatuses = Object.keys(projectStatusLabels) as [ProjectStatus, ...ProjectStatus[]];

export const projectTypeLabels = {
  application: 'Application',
  experiment: 'Experiment',
  other: 'Other',
} as const;

export type ProjectType = keyof typeof projectTypeLabels;

export const projectTypes = Object.keys(projectTypeLabels) as [ProjectType, ...ProjectType[]];

type Referencing = Dated & { data: { project?: { id: string } | undefined } };

/**
 * The articles that reference a project through their `project` frontmatter,
 * newest first: the case study's related writing (FR-04). Pass published
 * articles only, so drafts never appear.
 */
export function relatedWriting<T extends Referencing>(projectId: string, articles: readonly T[]): T[] {
  return newestFirst(articles.filter((article) => article.data.project?.id === projectId));
}

/** A project, as far as its place in the directory goes. */
export interface Orderable {
  data: { title: string; year: number; order?: number | undefined };
}

/**
 * The order projects appear in on `/work` and the homepage (architecture §5.1):
 * an explicit `order` first, lowest number first, then the rest; within those,
 * newest year first, then title A–Z so the result never depends on file order.
 */
export function directoryOrder<T extends Orderable>(projects: readonly T[]): T[] {
  return [...projects].sort(
    (a, b) =>
      (a.data.order ?? Infinity) - (b.data.order ?? Infinity) ||
      b.data.year - a.data.year ||
      a.data.title.localeCompare(b.data.title, 'en'),
  );
}
