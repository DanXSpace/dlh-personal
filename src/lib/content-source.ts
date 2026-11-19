/**
 * Decides which content a build reads and where it writes.
 *
 * Production builds read `src/content` and write `dist` (the only directory
 * that is ever deployed). Setting `CONTENT_SOURCE=fixtures` builds templates
 * against fixture entries in `tests/fixtures/content` and writes to
 * `dist-fixtures`, so fixture content can never ship. See ADR-0004.
 */
export interface ContentSource {
  name: 'production' | 'fixtures';
  /** Root that collection loaders glob from, relative to the project root. */
  contentRoot: string;
  /** Astro build output directory, relative to the project root. */
  outDir: string;
}

const SOURCES: Record<ContentSource['name'], ContentSource> = {
  production: { name: 'production', contentRoot: 'src/content', outDir: 'dist' },
  fixtures: { name: 'fixtures', contentRoot: 'tests/fixtures/content', outDir: 'dist-fixtures' },
};

export function resolveContentSource(
  env: Record<string, string | undefined>,
): ContentSource {
  const requested = env['CONTENT_SOURCE'];
  if (requested === undefined || requested === '') return SOURCES.production;
  if (requested === 'production' || requested === 'fixtures') return SOURCES[requested];
  throw new Error(
    `Unknown CONTENT_SOURCE "${requested}". Use "production", "fixtures", or leave it unset.`,
  );
}
