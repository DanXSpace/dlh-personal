/**
 * The draft rule (PRD FR-06, architecture §5.5): drafts never reach a
 * production build, and still render on the dev server so authors can preview
 * them. Pages read entries through `getPublished` in `content.ts`, which
 * applies this, so the rule lives in one place.
 */
export function isVisible(entry: { data: { draft: boolean } }, { production }: { production: boolean }): boolean {
  return !production || !entry.data.draft;
}
