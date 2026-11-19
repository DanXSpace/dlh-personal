---
title: Article template fixture
description: Test fixture that exercises every Markdown element the article template supports.
deck: A fixture for browser and accessibility tests. It never ships, and nothing in it describes real work.
published: 2026-03-14
updated: 2026-04-02
category: engineering
project: case-study-fixture
---

This fixture article exists so the article template can be tested against realistic Markdown. It is built only when `CONTENT_SOURCE=fixtures` is set, into a directory that is never deployed. Its paragraphs are long enough to wrap across several lines in the reading column, which makes the measure, the line height and the spacing between blocks visible in a browser.

Links inside prose are underlined, like [the Astro documentation](https://docs.astro.build/) and [the home page](/), so they never rely on color alone.

## Prose and lists

Unordered lists hold short items:

- The first item is short.
- The second item is long enough to wrap onto a second line in a narrow viewport, so the hanging indent can be checked.
- The third item has `inline code` in it.

Ordered lists keep their numbers:

1. Build the fixture site.
2. Serve it with the preview server.
3. Run the browser tests against it.

### A nested heading

An `h3` sits under the section above and appears nested in the table of contents.

## Code

A short TypeScript block, followed by a line that is far wider than the reading column so the block has to scroll inside its own container:

```ts
// Reading time skips fenced code like this block.
export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 230));
}

const aVeryLongLineThatForcesHorizontalScrollingInsideTheCodeBlock = 'and keeps going well past the edge of a 320 pixel wide viewport';
```

A block without a language:

```
plain text, not highlighted
```

## Tables and quotes

| Column | Purpose | Notes |
| --- | --- | --- |
| Element | What the fixture checks | A wide cell with enough text to push the table past the reading column on a phone, so the table scrolls in its own container |
| Table | Scroll containment | Keyboard focusable and labelled |

> A blockquote sets quoted text apart from the surrounding prose with a rule and an indent.

---

### Closing heading

The final section has an `h3` after a thematic break, the last element before the end of the article.

## Summary

Three or more `h2` headings give this article a table of contents by default.
