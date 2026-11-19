import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { compile } from 'tailwindcss';

// Compiles the real `global.css` the way the Vite plugin does, then asks
// Tailwind which utilities exist.
const stylesDir = path.resolve(import.meta.dirname, '../../src/styles');
const require = createRequire(import.meta.url);

async function utilities(candidates: string[]): Promise<string> {
  const compiler = await compile(await readFile(path.join(stylesDir, 'global.css'), 'utf8'), {
    base: stylesDir,
    async loadStylesheet(id, base) {
      const file = id === 'tailwindcss' ? require.resolve('tailwindcss/index.css') : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: await readFile(file, 'utf8') };
    },
  });
  return compiler.build(candidates);
}

test("Tailwind's default palette and scales are not available", async () => {
  const css = await utilities(['bg-red-500', 'text-slate-700', 'text-sm', 'shadow-md', 'rounded-lg', 'font-serif']);
  for (const selector of ['.bg-red-500', '.text-slate-700', '.text-sm', '.shadow-md', '.rounded-lg', '.font-serif']) {
    assert.ok(!css.includes(selector), `${selector} should not be generated`);
  }
  assert.ok(!css.includes('oklch('), 'no default palette values');
});

test('Tailwind utilities resolve to the design tokens, so they switch with the theme', async () => {
  const css = await utilities(['bg-bg', 'text-muted', 'border-control-border', 'font-mono', 'text-hero', 'max-w-measure', 'px-gutter']);
  const expected: [selector: string, token: string][] = [
    ['.bg-bg', 'var(--color-bg)'],
    ['.text-muted', 'var(--color-muted)'],
    ['.border-control-border', 'var(--color-control-border)'],
    ['.font-mono', 'var(--font-mono)'],
    ['.text-hero', 'var(--text-hero)'],
    ['.max-w-measure', 'var(--measure)'],
    ['.px-gutter', 'var(--gutter)'],
  ];
  for (const [selector, token] of expected) {
    const rule = css.match(new RegExp(`\\${selector} \\{([^}]*)\\}`))?.[1];
    assert.ok(rule?.includes(token), `${selector} should use ${token}, got ${rule}`);
  }
});

test('Tailwind does not redeclare the token variables, which would shadow them', async () => {
  const css = await utilities(['bg-bg', 'font-sans']);
  assert.doesNotMatch(css, /--color-bg:\s*var\(--color-bg\)/);
  assert.doesNotMatch(css, /--font-sans:\s*var\(--font-sans\)/);
});
