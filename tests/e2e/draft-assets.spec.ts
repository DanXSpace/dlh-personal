import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { copiesOf, draftImages } from '../../src/lib/draft-assets.ts';

// Astro copies every frontmatter image into `_astro/`, drafts included; the
// `draft-assets` build step removes the drafts' copies (src/lib/draft-assets.ts).
test('the production build ships no copy of a draft entry’s images', () => {
  expect(copiesOf(join('dist', '_astro'), draftImages('src/content'))).toEqual([]);
});
