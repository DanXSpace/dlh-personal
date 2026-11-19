/**
 * The command palette's behavior (PRD FR-11, architecture §9). Imported only
 * when the palette is first opened, so pages never load it otherwise.
 *
 * The markup lives in `CommandPalette.astro`: a native modal `<dialog>`, which
 * makes the rest of the page inert, plus an ARIA combobox (the input) that
 * controls a listbox of results. Focus stays on the input; arrow keys move the
 * active option through `aria-activedescendant`.
 */
import { createQueryRunner, staticSource, type PaletteEntry, type PaletteEntryKind, type ResultSource } from './palette.ts';
import { pagefindSource, type Pagefind } from './search.ts';

const kindLabels: Record<PaletteEntryKind, string> = {
  page: 'Page',
  article: 'Writing',
  project: 'Work',
};

export interface Palette {
  /** Opens the palette. `restoreFocus` runs when it closes, however it closes. */
  open(restoreFocus: () => void): void;
}

function countMessage(count: number): string {
  if (count === 0) return 'No matches';
  return count === 1 ? '1 result' : `${count} results`;
}

async function loadEntries(): Promise<PaletteEntry[] | undefined> {
  try {
    const response = await fetch('/palette.json');
    if (!response.ok) return undefined;
    return (await response.json()) as PaletteEntry[];
  } catch {
    return undefined;
  }
}

/**
 * Pagefind's browser bundle, written into the build output by `search-index.ts`.
 * Held in a variable so Vite leaves the import to the browser. Missing on the
 * dev server, where full-text search simply adds nothing.
 */
const pagefindUrl = '/pagefind/pagefind.js';

/** Stands in for Pagefind when the index holds no pages. */
const emptyIndex: Pagefind = { search: async () => ({ results: [] }) };

async function loadPagefind(): Promise<Pagefind> {
  // Pagefind throws an uncaught error on an index with no pages, which is
  // what a build with nothing published writes, so its entry file is read
  // first. Pagefind reads it again from the HTTP cache.
  const entry = await fetch('/pagefind/pagefind-entry.json');
  if (!entry.ok) throw new Error(`Search index unavailable (${entry.status})`);
  const { languages } = (await entry.json()) as { languages: Record<string, unknown> };
  if (Object.keys(languages).length === 0) return emptyIndex;
  return (await import(/* @vite-ignore */ pagefindUrl)) as Pagefind;
}

/** Pagefind's excerpt as text, with its `<mark>` highlights kept and any other markup dropped. */
function excerptNodes(html: string): Node[] {
  const parsed = new DOMParser().parseFromString(html, 'text/html').body;
  return [...parsed.childNodes].map((node) => {
    const text = node.textContent ?? '';
    if (node.nodeName !== 'MARK') return document.createTextNode(text);
    const mark = document.createElement('mark');
    mark.textContent = text;
    return mark;
  });
}

/** Selector for elements that can take focus inside the dialog. */
const focusable = 'input, button, [tabindex]:not([tabindex="-1"])';

export async function createPalette(dialog: HTMLDialogElement): Promise<Palette> {
  const input = dialog.querySelector<HTMLInputElement>('[role="combobox"]')!;
  const listbox = dialog.querySelector<HTMLElement>('[role="listbox"]')!;
  const status = dialog.querySelector<HTMLElement>('[role="status"]')!;
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-palette-close]')!;

  const entries = await loadEntries();
  // Titles of pages and content first, then full-text matches in article and
  // case-study bodies as they arrive (ticket 17).
  const sources: ResultSource[] = [staticSource(entries ?? []), pagefindSource(loadPagefind)];

  let results: PaletteEntry[] = [];
  let active = -1;
  let restoreFocus: (() => void) | undefined;

  function options(): HTMLAnchorElement[] {
    return [...listbox.querySelectorAll<HTMLAnchorElement>('[role="option"]')];
  }

  function setActive(index: number) {
    active = index;
    options().forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    const current = options()[index];
    if (current) {
      input.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  // Set for each new query. Later renders for the same query only add slower
  // results after the ones shown, so they keep the active option where it is.
  let newQuery = true;

  function render(next: PaletteEntry[], searching: boolean) {
    const keepActive = !newQuery && active >= 0 && active < next.length;
    newQuery = false;
    results = next;
    listbox.replaceChildren(
      ...next.map((entry, index) => {
        const option = document.createElement('a');
        option.id = `palette-option-${index}`;
        option.href = entry.href;
        option.tabIndex = -1;
        option.setAttribute('role', 'option');
        option.className = 'palette-option';
        const title = document.createElement('span');
        title.className = 'palette-option-title';
        title.textContent = entry.title;
        const kind = document.createElement('span');
        kind.className = 'palette-option-kind';
        kind.textContent = kindLabels[entry.kind];
        option.append(title, kind);
        if (entry.excerpt) {
          const excerpt = document.createElement('span');
          excerpt.className = 'palette-option-excerpt';
          excerpt.append(...excerptNodes(entry.excerpt));
          option.append(excerpt);
        }
        option.addEventListener('pointermove', () => {
          if (active !== index) setActive(index);
        });
        return option;
      }),
    );
    input.setAttribute('aria-expanded', String(next.length > 0));
    listbox.setAttribute('aria-busy', String(searching));
    status.textContent = statusMessage(next.length, searching);
    setActive(next.length > 0 ? (keepActive ? active : 0) : -1);
  }

  function statusMessage(count: number, searching: boolean): string {
    if (count > 0) return countMessage(count);
    if (searching) return 'Searching…';
    return entries === undefined ? 'Results couldn’t load. Use the site navigation instead.' : countMessage(0);
  }

  const run = createQueryRunner(sources, render);
  function runQuery(query: string) {
    newQuery = true;
    run(query);
  }

  input.addEventListener('input', () => runQuery(input.value));

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((active + step + results.length) % results.length);
    } else if (event.key === 'Enter' && !event.isComposing) {
      const entry = results[active];
      if (!entry) return;
      event.preventDefault();
      window.location.assign(entry.href);
    }
  });

  // Keep Tab inside the dialog. The browser would otherwise move focus to its
  // own interface after the last control.
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll<HTMLElement>(focusable)];
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });

  closeButton.addEventListener('click', () => dialog.close());

  // A click on the backdrop lands on the dialog itself, outside its panel.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Escape fires `cancel`, then `close`, as does every other way of closing.
  dialog.addEventListener('close', () => {
    restoreFocus?.();
    restoreFocus = undefined;
  });

  // Coming back to this page from one the palette opened can restore it from
  // the back/forward cache with the palette still open (Safari, Firefox).
  // Chromium under Playwright never uses that cache, so this isn't browser-tested.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && dialog.open) dialog.close();
  });

  return {
    open(onClose) {
      if (dialog.open) return;
      restoreFocus = onClose;
      input.value = '';
      runQuery('');
      dialog.showModal();
      input.focus();
    },
  };
}
