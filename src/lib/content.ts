import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { isVisible } from './drafts.ts';

/**
 * The one query pages, RSS, the sitemap and search read entries through
 * (architecture §5.5): drafts are left out of production builds and still
 * render on the dev server.
 */
export function getPublished<C extends CollectionKey>(collection: C): Promise<CollectionEntry<C>[]> {
  return getCollection(collection, (entry) =>
    isVisible(entry as { data: { draft: boolean } }, { production: import.meta.env.PROD }),
  );
}

/** Collections that hold at most one entry, `<collection>/index.md(x)`. */
export type SingleEntryCollection = 'about' | 'now' | 'home';

/**
 * A single-entry collection's entry, or undefined until the owner supplies it
 * (ticket 18). It goes through `getPublished`, so a draft About entry is left
 * out of production builds; Now and Home have no draft flag, so their entry
 * always shows.
 */
export async function getSingleEntry<C extends SingleEntryCollection>(
  collection: C,
): Promise<CollectionEntry<C> | undefined> {
  const [entry] = await getPublished(collection);
  return entry;
}
