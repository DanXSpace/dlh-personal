/**
 * Figure captions and responsive image sizes: for content figures, the case
 * study's wide image, `/work` row thumbnails and the homepage hero.
 */

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

/**
 * Responsive candidates for a case study's wide image, which spans the content
 * shell (design-spec §5). 58.5rem is just above the widest the shell's content
 * box gets: `--shell-max` (65rem) less its fluid `--gutter` on each side, about
 * 58.2rem at a 65rem viewport. Below that the image is close to full width.
 */
export const caseStudyImage = {
  widths: [480, 960, 1360, 1840],
  sizes: '(min-width: 65rem) 58.5rem, 100vw',
} as const;

/**
 * Responsive candidates for a `/work` row thumbnail. From 768px it spans four
 * of the 12 grid columns, about 13–18rem wide (18rem at the full 65rem shell);
 * below that rows stack and the thumbnail fills the viewport less its 1.5rem
 * `--gutter` on each side.
 */
export const directoryImage = {
  widths: [320, 480, 640, 960, 1280],
  sizes: '(min-width: 48rem) 18rem, calc(100vw - 3rem)',
} as const;

/**
 * Responsive candidates for the homepage hero image. From 1024px (64rem) it
 * takes five of the 12 grid columns, about 23rem of the 57–58rem shell content
 * box with 1.5rem column gaps. Below that the hero stacks and the image fills
 * the content box: the viewport less a 3–3.4rem `--gutter` on each side from
 * 768px, or 1.5rem below it.
 */
export const heroImage = {
  widths: [480, 720, 960, 1440, 1920],
  sizes: '(min-width: 64rem) 23.5rem, (min-width: 48rem) calc(100vw - 6rem), calc(100vw - 3rem)',
} as const;
