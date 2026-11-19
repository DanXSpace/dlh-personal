/**
 * Theme state and the render-blocking init script (architecture §8).
 *
 * `localStorage['theme']` holds an explicit choice, `'light'` or `'dark'`.
 * No stored value means System: the page follows `prefers-color-scheme`
 * through CSS alone, so OS changes apply live without script involvement.
 *
 * Imported by browser code, so it must stay free of Node APIs.
 */
export const THEME_STORAGE_KEY = 'theme';

export type ThemeChoice = 'system' | 'light' | 'dark';

/** Reads a stored or submitted value; anything but `'light'` or `'dark'` means System. */
export function parseThemeChoice(value: string | null): ThemeChoice {
  return value === 'light' || value === 'dark' ? value : 'system';
}

/**
 * Runs inline at the top of `<head>`, before any stylesheet or body content,
 * so an explicit choice is applied before first paint. It also swaps the
 * `no-js` class for `js`, which reveals JS-only controls. Storage access can
 * throw (blocked site data), in which case the page follows the OS.
 */
export const THEME_INIT_SCRIPT = `(()=>{const r=document.documentElement;r.classList.replace('no-js','js');try{const t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')r.dataset.theme=t}catch{}})();`;
