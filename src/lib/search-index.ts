/**
 * Builds the Pagefind full-text search index (PRD FR-05, architecture §9) once
 * Astro has written the site, into `<outDir>/pagefind/`. Each build indexes its
 * own output, so the fixture build's index stays in `dist-fixtures` and never
 * reaches `dist` (ADR-0004). Drafts are never built in production, so they are
 * never indexed.
 *
 * Only pages that mark content with `data-pagefind-body` (articles and case
 * studies) are added. Pagefind would index every whole page, nav and footer
 * included, if no page on the site carried that attribute, so the filter is
 * applied here rather than left to Pagefind.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import * as pagefind from 'pagefind';

/** An element carrying the attribute. Escaped mentions in prose or code (`&lt;div data-pagefind-body`) don't match. */
const SEARCHABLE = /<[a-z][^>]*\sdata-pagefind-body[\s=>]/i;

export function searchIndex(): AstroIntegration {
  return {
    name: 'search-index',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const { index, errors } = await pagefind.createIndex({
          forceLanguage: 'en',
          // Heading links (src/markdown/heading-anchors.ts) read "# Link to this section: …".
          excludeSelectors: ['.heading-anchor'],
        });
        if (!index) throw new Error(`Pagefind couldn’t start: ${errors.join('; ')}`);
        try {
          const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((path) => path.endsWith('.html'));
          let pages = 0;
          for (const sourcePath of files) {
            const content = readFileSync(join(root, sourcePath), 'utf8');
            if (!SEARCHABLE.test(content)) continue;
            const added = await index.addHTMLFile({ sourcePath, content });
            if (added.errors.length > 0) throw new Error(`Pagefind couldn’t index ${sourcePath}: ${added.errors.join('; ')}`);
            pages += 1;
          }
          const written = await index.writeFiles({ outputPath: join(root, 'pagefind') });
          if (written.errors.length > 0) throw new Error(`Pagefind couldn’t write its index: ${written.errors.join('; ')}`);
          logger.info(`Indexed ${pages} page(s) for search.`);
        } finally {
          await pagefind.close();
        }
      },
    },
  };
}
