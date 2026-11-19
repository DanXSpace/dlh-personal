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
import { nowSchema } from './lib/now.ts';
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

/**
 * The About page's copy (PRD FR-07, design-spec §4 `/about`): a single
 * `about/index.md(x)` entry, so biography edits never touch a component. Every
 * section is optional, and the page omits any section the entry leaves out.
 */
const about = defineCollection({
  loader: glob({ base: `${contentRoot}/about`, pattern: 'index.{md,mdx}' }),
  schema: ({ image }) => {
    const text = z.string().trim().min(1);
    /** An image shown as a numbered figure: `FIG. 01 / <label>`, then the caption. */
    const figure = z.object({ image: image(), alt: text, label: text, caption: text.optional() });
    return z.object({
      /** Paired with the opener; the entry's body is the opener's introduction. */
      portrait: figure.optional(),
      /** Career timeline, in the order listed. */
      timeline: z
        .array(z.object({ period: text, title: text, detail: text.optional() }))
        .min(1)
        .optional(),
      /** Jamaican heritage: paragraphs and a landscape figure, either optional. */
      heritage: z
        .object({ text: z.array(text).min(1).optional(), figure: figure.optional() })
        .refine((data) => data.text !== undefined || data.figure !== undefined, {
          message: 'Give `heritage` some `text`, a `figure`, or both, or leave `heritage` out.',
        })
        .optional(),
      /** Personal interests, each with an optional photo tile. */
      interests: z
        .array(
          z.object({
            name: text,
            detail: text.optional(),
            photo: z.object({ image: image(), alt: text }).optional(),
          }),
        )
        .min(1)
        .optional(),
      /**
       * The contact invitation's sentence. The invitation itself shows only
       * the links set in site config, and only once at least one is set.
       */
      contact: text.optional(),
      /** Meta description for search results and link previews. */
      description: text.max(160).optional(),
      draft: z.boolean().default(false),
    });
  },
});

/** A single entry, `now/index.md` (architecture §5.3); other files there are ignored. */
const now = defineCollection({
  loader: glob({ base: `${contentRoot}/now`, pattern: 'index.md' }),
  schema: nowSchema,
});

/**
 * A single entry, `home/index.md`, whose body is the homepage hero's
 * introduction (ticket 14). Other files there are ignored.
 */
const home = defineCollection({
  loader: glob({ base: `${contentRoot}/home`, pattern: 'index.md' }),
  schema: z.object({}),
});

export const collections = { projects, writing, now, about, home };
