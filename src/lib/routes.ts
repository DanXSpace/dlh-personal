/**
 * Content routes (architecture §4): where articles and projects live. Links
 * between pages have no trailing slash; canonical URLs, the sitemap and RSS
 * add one (`seo.ts`). Imported by browser code, so it must stay free of Node
 * APIs.
 */

/** The kinds of content entry that have their own page. */
export type EntryKind = 'article' | 'project';

const sections: Record<EntryKind, string> = { article: '/writing', project: '/work' };

/** The path of an entry's page, such as `/writing/first-note`. */
export function entryHref(kind: EntryKind, id: string): string {
  return `${sections[kind]}/${id}`;
}

/** The kind of entry whose page is at `path`, or undefined for any other page. */
export function entryKindOf(path: string): EntryKind | undefined {
  const [, section, id, ...rest] = withoutTrailingSlash(path).split('/');
  if (id === undefined || id === '' || rest.length > 0) return undefined;
  return (Object.keys(sections) as EntryKind[]).find((kind) => sections[kind] === `/${section}`);
}

/** `path` (or an origin) without trailing slashes; the root stays `/`. */
export function withoutTrailingSlash(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}
