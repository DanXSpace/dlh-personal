/**
 * Navigation state (architecture §8.0).
 *
 * `page` is the link to the exact current page and gets `aria-current="page"`.
 * `section` is the parent section of an interior page, such as Work on a case
 * study: shown as active with a non-color cue, without `aria-current`.
 */
import { withoutTrailingSlash } from './routes.ts';

export type NavState = 'page' | 'section' | 'none';

/** `/about/` and `/about` are the same page. */
export function navState(currentPath: string, href: string): NavState {
  const current = withoutTrailingSlash(currentPath);
  const target = withoutTrailingSlash(href);
  if (current === target) return 'page';
  if (target !== '/' && current.startsWith(`${target}/`)) return 'section';
  return 'none';
}
