/**
 * The command palette's data and query logic (PRD FR-11, architecture §9).
 *
 * The entry list is built at build time into `/palette.json`, so the palette
 * reads published content only. Imported by browser code, so it must stay free
 * of Node APIs.
 */
import type { Link } from './links.ts';
import { directoryOrder } from './projects.ts';

export type PaletteEntryKind = 'page' | 'article' | 'project';

/** One place the palette can go. */
export interface PaletteEntry {
  title: string;
  href: string;
  kind: PaletteEntryKind;
}

interface Article {
  id: string;
  data: { title: string; published: Date };
}

interface Project {
  id: string;
  data: { title: string; year: number; order?: number | undefined };
}

/**
 * Home and the primary navigation, then articles newest first, then projects
 * in the order `/work` lists them. Pass published entries only.
 */
export function paletteEntries({
  nav,
  articles,
  projects,
}: {
  nav: readonly Link[];
  articles: readonly Article[];
  projects: readonly Project[];
}): PaletteEntry[] {
  const pages = [{ label: 'Home', href: '/' }, ...nav].map(
    ({ label, href }): PaletteEntry => ({ title: label, href, kind: 'page' }),
  );
  const writing = [...articles]
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime())
    .map(({ id, data }): PaletteEntry => ({ title: data.title, href: `/writing/${id}`, kind: 'article' }));
  const work = directoryOrder(projects).map(
    ({ id, data }): PaletteEntry => ({ title: data.title, href: `/work/${id}`, kind: 'project' }),
  );
  return [...pages, ...writing, ...work];
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
 * then again each time a slower source answers. A newer query aborts the
 * previous one, whose late answers are dropped. A source that fails adds
 * nothing; the other results stay.
 */
export function createQueryRunner(
  sources: readonly ResultSource[],
  render: (results: PaletteEntry[]) => void,
): (query: string) => void {
  let current: AbortController | undefined;

  return (query) => {
    current?.abort();
    const controller = new AbortController();
    current = controller;
    const answers: (readonly PaletteEntry[])[] = sources.map(() => []);
    const show = () => render(answers.flat());

    sources.forEach((source, index) => {
      const answer = source.search(query, controller.signal);
      if (!(answer instanceof Promise)) {
        answers[index] = answer;
        return;
      }
      answer.then(
        (entries) => {
          if (controller.signal.aborted) return;
          answers[index] = entries;
          show();
        },
        () => {
          // A failed source contributes nothing; the others keep their results.
        },
      );
    });
    show();
  };
}
