import { join } from 'node:path/posix';

/**
 * Entry ids (slugs) for the content collections, and the duplicate check FR-12
 * asks for (architecture §5.5).
 *
 * An entry is `<slug>.md` or `<slug>/index.md`, and the slug becomes its URL.
 * Astro's glob loader only warns on a duplicate id, and its own optional check
 * can miss one when two new files load concurrently. So each collection's
 * loader takes its `generateId` from here, which sees every file in turn and
 * fails the build on a slug it has already given to a different file that
 * still exists.
 */

/** Lowercase letters and digits in runs joined by single hyphens. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface Options {
  /** Collection name, for error messages. */
  collection: string;
  /** The loader's base directory, relative to the project root. */
  base: string;
  /** Whether a project-relative path exists; injected so tests need no files. */
  exists: (path: string) => boolean;
}

/** Returns a glob loader `generateId` that rejects invalid and duplicate slugs. */
export function entryIds({ collection, base, exists }: Options): (options: { entry: string }) => string {
  const fileBySlug = new Map<string, string>();

  return ({ entry }) => {
    const file = join(base, entry);
    const slug = entry.replace(/(\/index)?\.[^./]+$/, '');
    if (!SLUG.test(slug)) {
      throw new Error(
        `Invalid slug "${slug}" in the ${collection} collection, from ${file}. ` +
          'Rename the file, or its folder, using lowercase letters, digits and single hyphens (for example "my-first-post").',
      );
    }

    const claimed = fileBySlug.get(slug);
    if (claimed !== undefined && claimed !== file && exists(claimed)) {
      throw new Error(
        `Duplicate slug "${slug}" in the ${collection} collection: ${claimed} and ${file}. ` +
          'Each entry needs its own slug, so rename or remove one of them.',
      );
    }
    fileBySlug.set(slug, file);
    return slug;
  };
}
