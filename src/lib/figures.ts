/**
 * Figure captions in the design spec's `FIG. 01 / ROOTS` form (design-spec §1,
 * architecture §6), shared by the `Figure` and `Diagram` content components.
 * Bad input throws, which fails the build with the message below.
 */
export function figureLabel(number: number, label: string): string {
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`Figure number ${number} must be a positive whole number, such as 1 for "FIG. 01".`);
  }
  const name = label.trim();
  if (name === '') {
    throw new Error(`Figure ${number} needs a short label, such as "Roots" for "FIG. 01 / ROOTS".`);
  }
  return `FIG. ${String(number).padStart(2, '0')} / ${name.toUpperCase()}`;
}

/**
 * Responsive image candidates for figures and image diagrams. `sizes` can't
 * read custom properties, so these values repeat tokens (tokens.css) and the
 * gallery gap (Gallery.astro) and must change with them:
 *
 * - 42.5rem is `--measure`, the reading column a lone figure fills.
 * - 45.5rem is the measure plus the 1.5rem `--gutter` on each side, the
 *   viewport at which that column stops being fluid.
 * - 48rem is `--breakpoint-md`, where a gallery leaves its stacked layout for
 *   columns separated by a 1.5rem gap.
 */
export const figureImage = {
  widths: [480, 680, 960, 1360],
  sizes: '(min-width: 45.5rem) 42.5rem, 100vw',
} as const;

/** `sizes` for a figure in a gallery of the given number of columns. */
export function galleryImageSizes(columns: 2 | 3): string {
  return `(min-width: 48rem) calc((42.5rem - ${columns - 1} * 1.5rem) / ${columns}), 100vw`;
}
