/**
 * Keeps draft images out of production builds (PRD FR-06, architecture §5.5).
 *
 * Astro's content layer imports every image named in any entry's frontmatter,
 * drafts included, so Vite emits each one into `<outDir>/_astro/`. Pages never
 * render a draft in production, so Astro never optimizes its images and never
 * removes the copied originals: they would be deployed, unlinked but public.
 * Once the site is written, this deletes every `_astro` file whose bytes match
 * an image beside a draft entry, unless a built page refers to it.
 */
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { isVisible } from './drafts.ts';

const IMAGE = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
const ENTRY = /\.mdx?$/i;
/** Built files that can refer to an asset by URL. */
const REFERRER = /\.(css|html|js|json|xml)$/i;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
/** A top-level `draft` key set to a YAML boolean true; the schema accepts only booleans. */
const DRAFT = /^draft:\s*true\s*(?:#.*)?$/im;

/**
 * The `draft` flag a Markdown or MDX source's frontmatter sets. Whether that
 * hides the entry is still decided by the one draft rule, `isVisible`.
 */
export function draftFlag(source: string): boolean {
  const frontmatter = FRONTMATTER.exec(source)?.[1];
  return frontmatter !== undefined && DRAFT.test(frontmatter);
}

/** Whether a path names an image Astro may copy into `_astro/`. */
export function isImagePath(path: string): boolean {
  return IMAGE.test(path);
}

function files(root: string): string[] {
  return readdirSync(root, { recursive: true, encoding: 'utf8' }).map((path) => join(root, path));
}

/** Images that sit in the same folder as an entry a production build hides. */
export function draftImages(contentRoot: string): string[] {
  const all = files(contentRoot);
  const hidden = (path: string) =>
    !isVisible({ data: { draft: draftFlag(readFileSync(path, 'utf8')) } }, { production: true });
  const draftDirs = new Set(all.filter((path) => ENTRY.test(path) && hidden(path)).map((path) => dirname(path)));
  return all.filter((path) => isImagePath(path) && draftDirs.has(dirname(path)));
}

/** Image files in `assetsDir` that are byte-identical copies of any of `images`. */
export function copiesOf(assetsDir: string, images: string[]): string[] {
  if (images.length === 0 || !existsSync(assetsDir)) return [];
  const sources = images.map((path) => readFileSync(path));
  return files(assetsDir).filter((path) => {
    if (!isImagePath(path)) return false;
    const bytes = readFileSync(path);
    return sources.some((source) => source.equals(bytes));
  });
}

/**
 * Files in `<outDir>/_astro/` that are byte-identical copies of `images` and
 * that no built page, stylesheet, script or feed refers to.
 */
export function leakedAssets(outDir: string, images: string[]): string[] {
  const copies = copiesOf(join(outDir, '_astro'), images);
  if (copies.length === 0) return [];
  const referrers = files(outDir)
    .filter((path) => REFERRER.test(path))
    .map((path) => readFileSync(path, 'utf8'));
  return copies.filter((path) => !referrers.some((text) => text.includes(basename(path))));
}

export function draftAssets(contentRoot: string): AstroIntegration {
  return {
    name: 'draft-assets',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const leaked = leakedAssets(fileURLToPath(dir), draftImages(contentRoot));
        for (const path of leaked) rmSync(path);
        if (leaked.length > 0) logger.info(`Removed ${leaked.length} draft image(s) from the build.`);
      },
    },
  };
}
