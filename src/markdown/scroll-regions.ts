import type { HastPlugin } from './pipeline.ts';

/** Spoken names for common language ids, so a screen reader says "TypeScript", not "T S". */
const LANGUAGE_NAMES: Record<string, string> = {
  bash: 'Shell',
  css: 'CSS',
  html: 'HTML',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  md: 'Markdown',
  py: 'Python',
  sh: 'Shell',
  shell: 'Shell',
  ts: 'TypeScript',
  tsx: 'TSX',
  yaml: 'YAML',
  yml: 'YAML',
};

/**
 * Wide code blocks and tables scroll inside their own container rather than
 * the page (design-spec §5, §7; architecture §6). The container is a labelled
 * region with `tabindex="0"`, so keyboard users can focus it and scroll with
 * the arrow keys, and screen readers announce what it holds.
 */
export const scrollRegions: HastPlugin = {
  name: 'scroll-regions',
  element: {
    filter: ['pre', 'table'],
    visit(node, ctx) {
      let label = 'Table';
      if (node.tagName === 'pre') {
        const language = node.properties['dataLanguage'];
        label = typeof language === 'string' && language !== 'plaintext' ? `Code: ${LANGUAGE_NAMES[language] ?? language}` : 'Code';
        // Shiki makes the <pre> focusable (as a raw lowercase `tabindex`); the
        // region is the tab stop instead.
        ctx.setProperty(node, 'tabindex', null);
      }
      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['scroll-region'], role: 'region', tabIndex: 0, ariaLabel: label },
        children: [],
      });
    },
  },
};
