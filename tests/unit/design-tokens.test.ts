import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Architecture §7.1: `src/styles/tokens.css` is the only place raw color, size
// or duration values live. Everything else references tokens.
const srcDir = path.resolve(import.meta.dirname, '../../src');
const tokenFile = path.join(srcDir, 'styles', 'tokens.css');

const rawValuePatterns: [string, RegExp][] = [
  ['hex color', /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi],
  ['color function', /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi],
  ['length', /(?<![\w-])-?\d*\.?\d+(?:px|rem|em|ch|ex|vw|vh|vmin|vmax|[sdl]v[hw]|pt|cm|mm|in)\b/gi],
  ['duration', /(?<![\w-])\d*\.?\d+m?s\b/gi],
  ['Tailwind numeric duration', /\b(?:duration|delay)-\d+\b/g],
];

/**
 * The parts of a file that carry styling: all of a CSS file, and in an Astro
 * component its `<style>` blocks and `class`/`style` attribute values (prose
 * and comments can mention "44 px" or "the 1990s" freely).
 */
function styleSources(file: string, source: string): string[] {
  if (file.endsWith('.css')) return [source.replace(/\/\*[\s\S]*?\*\//g, '')];
  const sources = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1] ?? '');
  for (const m of source.matchAll(/\b(?:class|style|class:list)=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g)) {
    sources.push(m[1] ?? m[2] ?? m[3] ?? '');
  }
  return sources.map((css) => css.replace(/\/\*[\s\S]*?\*\//g, ''));
}

function findRawValues(file: string, source: string): string[] {
  return styleSources(file, source).flatMap((css) =>
    rawValuePatterns.flatMap(([kind, pattern]) => [...css.matchAll(pattern)].map((m) => `${kind} ${m[0]}`)),
  );
}

async function styledFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(css|astro)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

test('the raw value check flags colors, sizes and durations in styles', () => {
  assert.deepEqual(findRawValues('a.css', '.a { color: #fafaf8; margin: 1.5rem; transition: color 150ms; }'), [
    'hex color #fafaf8',
    'length 1.5rem',
    'duration 150ms',
  ]);
  assert.deepEqual(findRawValues('a.astro', '<p class="p-[13px] text-[rgb(0,0,0)] duration-300">x</p>'), [
    'color function rgb(',
    'length 13px',
    'Tailwind numeric duration duration-300',
  ]);
  assert.deepEqual(findRawValues('a.astro', '<!-- a 44 px target --><a href="#main" class="px-gutter pt-6">In the 1990s</a>'), []);
});

test('no raw color, size or duration values exist outside the token file', async () => {
  const offenders: string[] = [];
  for (const file of await styledFiles(srcDir)) {
    if (file === tokenFile) continue;
    for (const value of findRawValues(file, await readFile(file, 'utf8'))) {
      offenders.push(`${path.relative(srcDir, file)}: ${value}`);
    }
  }
  assert.deepEqual(offenders, []);
});
