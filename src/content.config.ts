/**
 * Content collection schemas (architecture §5). A schema violation fails the
 * build with Astro's field-level message naming the file and field.
 */
import { existsSync } from 'node:fs';
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categories } from './lib/categories.ts';
import { entryIds } from './lib/content-ids.ts';
import { resolveContentSource } from './lib/content-source.ts';

const { contentRoot } = resolveContentSource(process.env);

/**
 * Entries are `<slug>.md(x)` or `<slug>/index.md(x)`, with invalid or duplicate
 * slugs failing the build.
 */
function entryLoader(collection: string) {
  const base = `${contentRoot}/${collection}`;
  return glob({
    base,
    pattern: ['*.{md,mdx}', '*/index.{md,mdx}'],
    generateId: entryIds({ collection, base, exists: existsSync }),
  });
}

const writing = defineCollection({
  loader: entryLoader('writing'),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        description: z.string().min(1).max(160),
        deck: z.string().min(1).optional(),
        published: z.coerce.date(),
        updated: z.coerce.date().optional(),
        category: z.enum(categories),
        project: reference('projects').optional(),
        toc: z.boolean().optional(),
        ogImage: image().optional(),
        draft: z.boolean().default(false),
      })
      .refine((data) => data.updated === undefined || data.updated >= data.published, {
        message: '`updated` must be on or after `published`.',
        path: ['updated'],
      }),
});

export const collections = { writing };
