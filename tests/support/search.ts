import type { APIRequestContext } from '@playwright/test';

/** How many pages the build's Pagefind index holds. */
export async function indexedPages(request: APIRequestContext): Promise<number> {
  const index = (await (await request.get('/pagefind/pagefind-entry.json')).json()) as {
    languages: Record<string, { page_count: number }>;
  };
  return Object.values(index.languages).reduce((total, { page_count }) => total + page_count, 0);
}

/** How many articles and projects the build publishes, from the palette's entry list. */
export async function publishedEntries(request: APIRequestContext): Promise<number> {
  const entries = (await (await request.get('/palette.json')).json()) as { kind: string }[];
  return entries.filter(({ kind }) => kind === 'article' || kind === 'project').length;
}
