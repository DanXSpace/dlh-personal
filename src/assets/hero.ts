/**
 * The homepage hero image (PRD FR-02, design-spec §1).
 *
 * PREVIEW ASSET. `preview/hero-landscape-preview.jpg` is a generated stand-in
 * with "PREVIEW IMAGE / NOT FOR PRODUCTION" drawn on it, used until the owner
 * supplies the licensed monochrome Jamaican landscape (ticket 18). While
 * `preview` is true the hero's figure carries `data-preview-asset` and its
 * caption says it is a preview, so the launch gate (ticket 20) can detect it:
 * it must find no `data-preview-asset` attribute in `dist/**\/*.html` and no
 * `hero-landscape-preview` file in `dist/_astro/`.
 *
 * To launch: add the licensed image under `src/assets/`, import it here,
 * describe it in `alt`, set `preview` to false, delete `src/assets/preview/`,
 * and update the focal point (`object-position`) in `Hero.astro`. It lives in
 * CSS because the CSP blocks inline `style` attributes.
 */
import type { ImageMetadata } from 'astro';
import previewLandscape from './preview/hero-landscape-preview.jpg';

export interface HeroImage {
  src: ImageMetadata;
  alt: string;
  /** True while the image is a stand-in that must not launch. */
  preview: boolean;
}

export const heroImage: HeroImage = {
  src: previewLandscape,
  alt: 'Preview image: layered gray ridgelines standing in for the hero landscape.',
  preview: true,
};
