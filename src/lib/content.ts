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
