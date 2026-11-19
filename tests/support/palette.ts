import type { APIRequestContext } from '@playwright/test';

/**
 * The titles the command palette lists before a query, in order, read from the
 * build's own `/palette.json`. Production tests use this rather than a fixed
 * list, because the entries grow as the owner publishes content.
 */
export async function paletteTitles(request: APIRequestContext): Promise<string[]> {
  const entries = (await (await request.get('/palette.json')).json()) as { title: string }[];
  return entries.map(({ title }) => title);
}

/** A pattern matching an option whose accessible name starts with `title`. */
export function startsWith(title: string): RegExp {
  return new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

/** The palette's live-region count for `count` results. */
export function resultCount(count: number): string {
  return count === 0 ? 'No matches' : `${count} ${count === 1 ? 'result' : 'results'}`;
}
