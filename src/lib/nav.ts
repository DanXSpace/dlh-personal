/**
 * Navigation state (architecture §8.0).
 *
 * `page` is the link to the exact current page and gets `aria-current="page"`.
 * `section` is the parent section of an interior page, such as Work on a case
 * study: shown as active with a non-color cue, without `aria-current`.
 */
export type NavState = 'page' | 'section' | 'none';

/** `/about/` and `/about` are the same page; the root stays `/`. */
function withoutTrailingSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function navState(currentPath: string, href: string): NavState {
  const current = withoutTrailingSlash(currentPath);
  const target = withoutTrailingSlash(href);
  if (current === target) return 'page';
  if (target !== '/' && current.startsWith(`${target}/`)) return 'section';
  return 'none';
}
