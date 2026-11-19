/**
 * Estimated reading time of an entry, from its raw Markdown body (architecture
 * §5.5). Fenced code blocks are skipped: readers scan code rather than read it
 * word by word, and long listings would otherwise inflate the estimate.
 */

const WORDS_PER_MINUTE = 230;

/** An opening or closing fence: three or more backticks or tildes. */
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** A token counts as a word only if it has a letter or digit, so `-`, `>` and `|` don't. */
const WORDLIKE = /[\p{L}\p{N}]/u;

function withoutFencedCode(markdown: string): string {
  const prose: string[] = [];
  let openFence: string | undefined;
  for (const line of markdown.split('\n')) {
    const fence = FENCE.exec(line)?.[1];
    if (openFence === undefined) {
      if (fence) openFence = fence;
      else prose.push(line);
    } else if (fence && fence[0] === openFence[0] && fence.length >= openFence.length) {
      openFence = undefined;
    }
  }
  return prose.join('\n');
}

/** Whole minutes, rounded up, and never less than one. */
export function readingMinutes(markdown: string): number {
  const words = withoutFencedCode(markdown)
    .split(/\s+/)
    .filter((token) => WORDLIKE.test(token)).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
