/**
 * Projects (PRD FR-03, FR-04; architecture §5.1). The label maps' keys are the
 * values allowed in frontmatter; the labels are what readers see.
 */
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

interface Referencing {
  data: { published: Date; project?: { id: string } | undefined };
}

/**
 * The articles that reference a project through their `project` frontmatter,
 * newest first: the case study's related writing (FR-04). Pass published
 * articles only, so drafts never appear.
 */
export function relatedWriting<T extends Referencing>(projectId: string, articles: readonly T[]): T[] {
  return articles
    .filter((article) => article.data.project?.id === projectId)
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}
