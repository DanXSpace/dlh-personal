/**
 * Writing categories (PRD FR-05, architecture §5.2). The keys are the values
 * allowed in frontmatter and used in category URLs; the labels are what
 * readers see.
 */
export const categoryLabels = {
  engineering: 'Engineering',
  'build-logs': 'Build logs',
  learning: 'Learning',
  technology: 'Technology',
  life: 'Life',
} as const;

export type Category = keyof typeof categoryLabels;

export const categories = Object.keys(categoryLabels) as [Category, ...Category[]];
