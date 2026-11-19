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

/**
 * The Now entry (architecture §5.3), or undefined until `now/index.md` exists.
 * It has no draft flag: the page shows whatever snapshot is committed.
 */
export async function getNow(): Promise<CollectionEntry<'now'> | undefined> {
  const [entry] = await getCollection('now');
  return entry;
}

/**
 * The homepage entry (`home/index.md`), whose body is the hero's
 * introduction, or undefined until the owner supplies one (ticket 18).
 */
export async function getHomeIntroduction(): Promise<CollectionEntry<'home'> | undefined> {
  const [entry] = await getCollection('home');
  return entry;
}

/** The Now entry's optional homepage summary, for the homepage's "In the present" section. */
export async function getNowSummary(): Promise<string | undefined> {
  return (await getNow())?.data.summary;
}
