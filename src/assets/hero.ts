/**
 * The homepage hero image (PRD FR-02, design-spec §1): the owner's own
 * photograph of a beach cove in Jamaica, converted to monochrome with its
 * metadata stripped (rights recorded in docs/asset-rights.md).
 *
 * `preview` marks a stand-in that must not launch: while it is true the hero's
 * figure carries `data-preview-asset` and its caption says it is a preview, so
 * the launch gate (ticket 20) can detect it. When the image changes, update
 * its focal point (`object-position`) in `Hero.astro`; it lives in CSS because
 * the CSP blocks inline `style` attributes.
 */
import type { ImageMetadata } from 'astro';
import landscape from './hero-landscape.jpg';

export interface HeroImage {
  src: ImageMetadata;
  alt: string;
  /** True while the image is a stand-in that must not launch. */
  preview: boolean;
}

export const heroImage: HeroImage = {
  src: landscape,
  alt: 'A small sandy cove in Jamaica, with waves breaking against rocky cliffs, seen between leaning, feathery trees.',
  preview: false,
};
