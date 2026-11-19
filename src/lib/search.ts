/**
 * Full-text search for the command palette (PRD FR-05, architecture §9): a
 * `ResultSource` backed by the Pagefind index that `search-index.ts` writes at
 * build time. Imported by browser code, so it must stay free of Node APIs.
 */
import type { PaletteEntry, PaletteEntryKind, ResultSource } from './palette.ts';

/** What Pagefind knows about one matching page. */
export interface PagefindResultData {
  url: string;
  meta: { title?: string };
  /** A short passage around the match, HTML-escaped, with matched words in `<mark>`. */
  excerpt: string;
}

/** The part of Pagefind's browser API (`/pagefind/pagefind.js`) the palette uses. */
export interface Pagefind {
  search(query: string): Promise<{ results: { data(): Promise<PagefindResultData> }[] } | null>;
}

/** Pagefind ranks results best first. Each one kept costs a small download. */
const MAX_RESULTS = 8;

function kindOf(href: string): PaletteEntryKind {
  if (href.startsWith('/writing/')) return 'article';
  if (href.startsWith('/work/')) return 'project';
  return 'page';
}

function toEntry({ url, meta, excerpt }: PagefindResultData): PaletteEntry {
  // Pagefind links to `/writing/slug/`; the palette's other entries use `/writing/slug`.
  const href = url.length > 1 ? url.replace(/\/$/, '') : url;
  return { title: meta.title ?? href, href, kind: kindOf(href), excerpt };
}

/**
 * Searches the index for each query. `load` imports Pagefind, and runs only
 * once the visitor types something, so the search bundle never loads before
 * search is used.
 */
export function pagefindSource(load: () => Promise<Pagefind>): ResultSource {
  let loading: Promise<Pagefind> | undefined;

  return {
    async search(query, signal) {
      if (query.trim() === '') return [];
      loading ??= load().catch((error: unknown) => {
        loading = undefined; // Let the next query retry the download.
        throw error;
      });
      const pagefind = await loading;
      const found = await pagefind.search(query);
      if (!found || signal.aborted) return [];
      const pages = await Promise.all(found.results.slice(0, MAX_RESULTS).map((result) => result.data()));
      return pages.map(toEntry);
    },
  };
}
