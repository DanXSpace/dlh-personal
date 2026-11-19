import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { hastPlugins, shikiConfig } from '../../src/markdown/pipeline.ts';

/** Renders Markdown with Astro's own Sätteri renderer, configured as astro.config.ts configures it. */
async function render(markdown: string) {
  const renderer = await createSatteriMarkdownProcessor({ syntaxHighlight: 'shiki', shikiConfig, hastPlugins });
  const { code, metadata } = await renderer.render(markdown);
  return { html: code, headings: metadata.headings };
}

test('headings get ids and a visible anchor link that names its section for screen readers', async () => {
  const { html } = await render('## Why it *matters*\n\nText.');
  assert.match(html, /<h2 id="why-it-matters">Why it <em>matters<\/em><\/h2>/);
  assert.match(
    html,
    /<a class="heading-anchor" href="#why-it-matters"><span aria-hidden="true">#<\/span><span class="sr-only">Link to this section: Why it matters<\/span><\/a>/,
  );
});

test('the anchor link sits beside the heading, so heading text and the contents list stay clean', async () => {
  const { html, headings } = await render('## One\n\n### Two');
  assert.doesNotMatch(html, /<h2[^>]*>[^<]*<a/);
  assert.deepEqual(headings, [
    { depth: 2, slug: 'one', text: 'One' },
    { depth: 3, slug: 'two', text: 'Two' },
  ]);
});

test('tables scroll inside a labelled, keyboard-focusable region', async () => {
  const { html } = await render('| a | b |\n| - | - |\n| 1 | 2 |');
  assert.match(html, /<div class="scroll-region" role="region" tabindex="0" aria-label="Table"><table>/);
});

test('code blocks scroll inside a labelled, keyboard-focusable region named for their language', async () => {
  const { html } = await render('```ts\nconst answer = 42;\n```');
  assert.match(html, /<div class="scroll-region" role="region" tabindex="0" aria-label="Code: TypeScript"><pre/);
  // The region is the only tab stop, not the region and the <pre> both.
  assert.doesNotMatch(html, /<pre[^>]*tabindex/);
});

test('a language without a spoken name keeps its id in the label', async () => {
  const { html } = await render('```rust\nfn main() {}\n```');
  assert.match(html, /aria-label="Code: rust"><pre/);
});

test('a code block without a language is labelled plainly', async () => {
  const { html } = await render('```\nplain\n```');
  assert.match(html, /aria-label="Code"><pre/);
});

test('code is highlighted with token classes instead of inline styles, which the CSP blocks', async () => {
  const { html } = await render('```ts\n// note\nconst answer = "yes";\n```');
  assert.doesNotMatch(html, /style=/);
  assert.match(html, /<span class="token-comment">\/\/ note<\/span>/);
  assert.match(html, /<span class="token-keyword">const<\/span>/);
  assert.match(html, /<span class="token-string-expression"> "yes"<\/span>/);
});
