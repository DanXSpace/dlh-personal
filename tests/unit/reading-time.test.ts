import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readingMinutes } from '../../src/lib/reading-time.ts';

const words = (count: number) => Array.from({ length: count }, () => 'word').join(' ');

test('a short entry still reads as one minute', () => {
  assert.equal(readingMinutes('Just a few words.'), 1);
  assert.equal(readingMinutes(''), 1);
});

test('reading time rounds up at about 230 words a minute', () => {
  assert.equal(readingMinutes(words(230)), 1);
  assert.equal(readingMinutes(words(231)), 2);
  assert.equal(readingMinutes(words(1150)), 5);
});

test('fenced code blocks are not counted as reading', () => {
  const body = [words(230), '```ts', words(2000), '```', '~~~', words(2000), '~~~'].join('\n');
  assert.equal(readingMinutes(body), 1);
});

test('a fence opened with a longer run of backticks closes only with an equal or longer run', () => {
  const body = [words(200), '````md', '```js', words(1000), '```', '````', words(30)].join('\n');
  assert.equal(readingMinutes(body), 1);
});

test('markdown punctuation on its own is not counted as words', () => {
  const body = `## Heading\n\n- ${words(229)}\n\n---\n\n> |  |  |`;
  assert.equal(readingMinutes(body), 1);
});

test('MDX import and export lines are not counted as reading', () => {
  const esm = Array.from({ length: 40 }, (_, i) => `import image${i} from './images/a-long-file-name-${i}.jpg';`);
  const body = [...esm, "export const note = 'not prose';", '', words(230)].join('\n');
  assert.equal(readingMinutes(body), 1);
});

test('a prose line that starts with the word "import" still counts', () => {
  const body = [words(229), '', 'Import duties shaped the economy.'].join('\n');
  assert.equal(readingMinutes(body), 2);
});
