import type { ShikiConfig } from 'astro';
import type { Element, ElementContent, Root } from 'hast';

type ShikiTransformer = NonNullable<ShikiConfig['transformers']>[number];

/** A token color from Astro's `css-variables` Shiki theme, e.g. `var(--astro-code-token-keyword)`. */
const TOKEN_COLOR = /var\(--astro-code-(token-[\w-]+)\)/;

function stylesToClasses(node: Element): void {
  const style = node.properties['style'];
  if (typeof style === 'string') {
    const token = TOKEN_COLOR.exec(style)?.[1];
    if (token) {
      const existing = node.properties['className'];
      node.properties['className'] = [...(Array.isArray(existing) ? existing : []), token];
    }
    delete node.properties['style'];
  }
  node.children.forEach(visitChild);
}

function visitChild(node: ElementContent | Root['children'][number]): void {
  if (node.type === 'element') stylesToClasses(node);
}

/**
 * Highlighted code without inline styles (architecture §6, §11).
 *
 * Shiki colors tokens with `style` attributes, which the site's content
 * security policy blocks. With Astro's `css-variables` theme each token's
 * color names its kind, so this turns it into a class (`token-keyword`,
 * `token-comment`, ...) and drops every style attribute. `prose.css` styles
 * the classes from the design tokens, so code follows the theme like
 * everything else.
 */
export const shikiTokenClasses: ShikiTransformer = {
  name: 'token-classes',
  root(root: Root) {
    root.children.forEach(visitChild);
  },
};
