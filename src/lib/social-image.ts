/**
 * Resolves an entry's own link-preview image (architecture §10.2): a 1200 × 630
 * JPEG crop of a content image, or the site default when there is none.
 */
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { defaultSocialImage, socialImageSize, type SocialImage } from './seo.ts';

export async function socialImage(image: ImageMetadata | undefined, alt?: string): Promise<SocialImage> {
  if (image === undefined) return defaultSocialImage;
  const { src } = await getImage({ src: image, ...socialImageSize, fit: 'cover', format: 'jpg' });
  return { src, ...socialImageSize, alt };
}
