/**
 * The content components MDX entries can use without importing them
 * (architecture §6). Pages pass this map to an entry's `<Content components>`.
 */
import Callout from './Callout.astro';
import Diagram from './Diagram.astro';
import Figure from './Figure.astro';
import Gallery from './Gallery.astro';
import Meta from './Meta.astro';

export const contentComponents = { Callout, Diagram, Figure, Gallery, Meta };
