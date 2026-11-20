/**
 * Figure captions and responsive image sizes and formats: for content figures,
 * the case study's wide image, `/work` row thumbnails, the homepage hero and
 * the About page's images.
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
 *   viewport at which that column stops being fluid. Below it the figure fills
 *   the viewport less those gutters, `calc(100vw - 3rem)`. From 768px the
 *   gutter grows to 3rem or more, so the shell's content box can be a little
 *   under the measure there (42rem at 768px); claiming the full measure is
 *   close enough.
 * - 48rem is `--breakpoint-md`, where a gallery leaves its stacked layout for
 *   columns separated by a 1.5rem gap.
 */
export const figureImage = {
  widths: [480, 680, 960, 1360],
  sizes: '(min-width: 45.5rem) 42.5rem, calc(100vw - 3rem)',
} as const;

/**
 * `sizes` for a figure in a gallery of the given number of columns. From
 * 768px each figure takes its share of the measure less the gaps; below that
 * figures stack and size like a lone figure.
 */
export function galleryImageSizes(columns: 2 | 3): string {
  return `(min-width: 48rem) calc((42.5rem - ${columns - 1} * 1.5rem) / ${columns}), (min-width: 45.5rem) 42.5rem, calc(100vw - 3rem)`;
}

/**
 * Responsive candidates for a case study's wide image, which spans the content
 * shell (design-spec §5). 58.5rem is just above the widest the shell's content
 * box gets: `--shell-max` (65rem) less its fluid `--gutter` on each side, about
 * 58.2rem at a 65rem viewport. Below that the image fills the viewport less
 * the gutters: 3–3.4rem on each side from 768px, 1.5rem below it.
 */
export const caseStudyImage = {
  widths: [480, 960, 1360, 1840],
  sizes: '(min-width: 65rem) 58.5rem, (min-width: 48rem) calc(100vw - 6rem), calc(100vw - 3rem)',
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

/**
 * `sizes` for the About portrait, which spans the trailing five of the 12 grid
 * columns from 768px (about 23.5rem at the full 65rem shell, under 40vw below
 * it) and fills the viewport less its gutters when stacked.
 */
export const aboutPortraitSizes = '(min-width: 65rem) 23.5rem, (min-width: 48rem) 40vw, calc(100vw - 3rem)';

/**
 * `sizes` for the About landscape, which spans the trailing seven of the 12
 * grid columns from 1024px (about 33–34rem at the full 65rem shell, under 55vw
 * below it). When stacked it fills the content width: the viewport less a
 * 3–3.4rem `--gutter` on each side from 768px, or 1.5rem below it.
 */
export const aboutLandscapeSizes =
  '(min-width: 65rem) 34rem, (min-width: 64rem) 55vw, (min-width: 48rem) calc(100vw - 6rem), calc(100vw - 3rem)';

/**
 * Responsive candidates for an About interest photo tile: a third of the shell
 * from 1024px (about 18.5rem), half of it from 768px, and the viewport less
 * its 1.5rem `--gutter` on each side when tiles stack.
 */
export const interestTileImage = {
  widths: [320, 480, 640, 960],
  sizes: '(min-width: 64rem) 18.5rem, (min-width: 48rem) 45vw, calc(100vw - 3rem)',
} as const;

/**
 * Formats for a raster image rendered through `astro:assets` `<Picture>`
 * (architecture §2): an AVIF `<source>` for browsers that support it, with the
 * WebP `<img>` as the fallback. Without `fallbackFormat` Astro falls back to
 * the source format, so JPEG sources would ship JPEG. The AVIF encoder quality
 * is set once in astro.config.ts. SVG images keep `<Image>`.
 */
export const rasterFormats: { formats: ['avif']; fallbackFormat: 'webp' } = {
  formats: ['avif'],
  fallbackFormat: 'webp',
};
