import { satteriHeadingIdsPlugin, type SatteriProcessorOptions } from '@astrojs/markdown-satteri';
import type { ShikiConfig } from 'astro';
import { headingAnchors } from './heading-anchors.ts';
import { scrollRegions } from './scroll-regions.ts';
import { shikiTokenClasses } from './shiki-token-classes.ts';

type HastPluginList = NonNullable<SatteriProcessorOptions['hastPlugins']>;

/** One Sätteri hast plugin, typed through `@astrojs/markdown-satteri` (its declared parent package). */
export type HastPlugin = Extract<HastPluginList[number], { name: string }>;

/**
 * The Markdown pipeline (architecture §6), shared by astro.config.ts and the
 * unit tests so both render the same way. Astro runs Shiki before these
 * plugins and its own heading-ids pass after them; that pass keeps the ids
 * set here, so the headings `render()` returns match the anchors.
 */
export const hastPlugins: HastPluginList = [satteriHeadingIdsPlugin(), headingAnchors, scrollRegions];

export const shikiConfig: Partial<ShikiConfig> = {
  theme: 'css-variables',
  // Leave wrapping and overflow to prose.css rather than an inline style.
  wrap: null,
  transformers: [shikiTokenClasses],
};
