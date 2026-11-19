import type { HastPlugin } from './pipeline.ts';

/**
 * Visible anchor links on article headings (design-spec §4, architecture §6).
 *
 * Each heading is wrapped with its link as a sibling, not a child, so the
 * heading's text, its accessible name and the table of contents stay free of
 * the link. Needs heading ids, so it runs after `satteriHeadingIdsPlugin()`.
 */
export const headingAnchors: HastPlugin = {
  name: 'heading-anchors',
  element: {
    filter: ['h2', 'h3', 'h4', 'h5', 'h6'],
    visit(heading, ctx) {
      const id = heading.properties['id'];
      if (typeof id !== 'string') return;
      ctx.wrapNode(heading, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['heading-anchored'] },
        children: [
          {
            type: 'element',
            tagName: 'a',
            properties: { className: ['heading-anchor'], href: `#${id}` },
            children: [
              { type: 'element', tagName: 'span', properties: { ariaHidden: 'true' }, children: [{ type: 'text', value: '#' }] },
              {
                type: 'element',
                tagName: 'span',
                properties: { className: ['sr-only'] },
                children: [{ type: 'text', value: `Link to this section: ${ctx.textContent(heading)}` }],
              },
            ],
          },
        ],
      });
    },
  },
};
