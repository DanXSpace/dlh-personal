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

/** Selector for elements that can take focus inside the dialog. */
const focusable = 'input, button, [tabindex]:not([tabindex="-1"])';

export async function createPalette(dialog: HTMLDialogElement): Promise<Palette> {
  const input = dialog.querySelector<HTMLInputElement>('[role="combobox"]')!;
  const listbox = dialog.querySelector<HTMLElement>('[role="listbox"]')!;
  const status = dialog.querySelector<HTMLElement>('[role="status"]')!;
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-palette-close]')!;

  const entries = await loadEntries();
  // More sources plug in here, such as full-text search (ticket 17).
  const sources: ResultSource[] = [staticSource(entries ?? [])];

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

  function render(next: PaletteEntry[]) {
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
        option.addEventListener('pointermove', () => {
          if (active !== index) setActive(index);
        });
        return option;
      }),
    );
    input.setAttribute('aria-expanded', String(next.length > 0));
    status.textContent = entries === undefined ? 'Results couldn’t load. Use the site navigation instead.' : countMessage(next.length);
    setActive(next.length > 0 ? 0 : -1);
  }

  const runQuery = createQueryRunner(sources, render);

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
