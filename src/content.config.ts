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
import { projectStatuses, projectTypes } from './lib/projects.ts';

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

const projects = defineCollection({
  loader: entryLoader('projects'),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        summary: z.string().min(1).max(160),
        thumbnail: image().optional(),
        thumbnailAlt: z.string().trim().min(1).optional(),
        cover: image().optional(),
        coverAlt: z.string().trim().min(1).optional(),
        stack: z.array(z.string().trim().min(1)).min(1),
        status: z.enum(projectStatuses),
        type: z.enum(projectTypes),
        year: z.number().int(),
        featured: z.boolean().default(false),
        order: z.number().optional(),
        repo: z.url().optional(),
        live: z.url().optional(),
        draft: z.boolean().default(false),
      })
      .refine((data) => data.thumbnail === undefined || data.thumbnailAlt !== undefined, {
        message: 'Describe the thumbnail in `thumbnailAlt`, so the image is never missing alt text.',
        path: ['thumbnailAlt'],
      })
      .refine((data) => data.cover === undefined || data.coverAlt !== undefined, {
        message: 'Describe the cover in `coverAlt`, so the image is never missing alt text.',
        path: ['coverAlt'],
      }),
});

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

export const collections = { projects, writing };
