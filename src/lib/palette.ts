/**
 * The command palette's data and query logic (PRD FR-11, architecture §9).
 *
 * The entry list is built at build time into `/palette.json`, so the palette
 * reads published content only. Imported by browser code, so it must stay free
 * of Node APIs.
 */
import { newestFirst, type Dated } from './archive.ts';
import type { Link } from './links.ts';
import { directoryOrder, type Orderable } from './projects.ts';

export type PaletteEntryKind = 'page' | 'article' | 'project';

/** One place the palette can go. */
export interface PaletteEntry {
  title: string;
  href: string;
  kind: PaletteEntryKind;
  /**
   * Full-text search results only (`search.ts`): a passage around the match,
   * HTML-escaped by Pagefind, with matched words in `<mark>`.
   */
  excerpt?: string;
}

type Article = Dated & { id: string; data: { title: string } };

type Project = Orderable & { id: string };

/**
 * Home and the other primary pages, then articles newest first, then projects
 * in the order `/work` lists them. Pass published entries only.
 */
export function paletteEntries({
  pages,
  articles,
  projects,
}: {
  pages: readonly Link[];
  articles: readonly Article[];
  projects: readonly Project[];
}): PaletteEntry[] {
  const primary = [{ label: 'Home', href: '/' }, ...pages].map(
    ({ label, href }): PaletteEntry => ({ title: label, href, kind: 'page' }),
  );
  const writing = newestFirst(articles).map(({ id, data }): PaletteEntry => ({ title: data.title, href: `/writing/${id}`, kind: 'article' }));
  const work = directoryOrder(projects).map(
    ({ id, data }): PaletteEntry => ({ title: data.title, href: `/work/${id}`, kind: 'project' }),
  );
  return [...primary, ...writing, ...work];
}

/** Lowercase with accents removed, so `resume` finds `Résumé`. */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * The entries whose title contains every word of the query, in any order,
 * ignoring case and accents. Listed order is kept; a blank query keeps all.
 */
export function filterEntries(entries: readonly PaletteEntry[], query: string): PaletteEntry[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return entries.filter((entry) => {
    const title = fold(entry.title);
    return words.every((word) => title.includes(word));
  });
}

/**
 * Where the palette's results come from. A source answers synchronously, like
 * the built-in list of pages and content, or with a Promise, like a search
 * index that loads on first use (ticket 17). `signal` aborts when a newer
 * query replaces this one, so a slow source can stop early.
 */
export interface ResultSource {
  search(query: string, signal: AbortSignal): readonly PaletteEntry[] | Promise<readonly PaletteEntry[]>;
}

/** The fixed entry list from `/palette.json`, filtered as the user types. */
export function staticSource(entries: readonly PaletteEntry[]): ResultSource {
  return { search: (query) => filterEntries(entries, query) };
}

/**
 * Runs each query against every source and calls `render` with the combined
 * results, in source order: at once with the synchronous sources' results,
 * then again each time a slower source answers. `searching` is true while a
 * slower source has yet to answer. A page that more than one source finds is
 * listed once, by the first. A newer query aborts the previous one, whose late
 * answers are dropped. A source that fails adds nothing; the other results stay.
 */
export function createQueryRunner(
  sources: readonly ResultSource[],
  render: (results: PaletteEntry[], searching: boolean) => void,
): (query: string) => void {
  let current: AbortController | undefined;

  return (query) => {
    current?.abort();
    const controller = new AbortController();
    current = controller;
    const answers: (readonly PaletteEntry[])[] = sources.map(() => []);
    let waiting = 0;
    const show = () => {
      // A page found by more than one source is listed once, where it first appears.
      const seen = new Set<string>();
      render(
        answers.flat().filter(({ href }) => !seen.has(href) && seen.add(href)),
        waiting > 0,
      );
    };

    sources.forEach((source, index) => {
      const answer = source.search(query, controller.signal);
      if (!(answer instanceof Promise)) {
        answers[index] = answer;
        return;
      }
      waiting += 1;
      answer
        .then(
          (entries) => {
            answers[index] = entries;
          },
          () => {
            // A failed source contributes nothing; the others keep their results.
          },
        )
        .then(() => {
          if (controller.signal.aborted) return;
          waiting -= 1;
          show();
        });
    });
    show();
  };
}
