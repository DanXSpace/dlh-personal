import { expect, test, type Page } from '@playwright/test';
import { paletteTitles, resultCount, startsWith } from '../support/palette.ts';

/** Same-origin paths the page has requested so far, recorded from the start of the test. */
function recordRequests(page: Page): string[] {
  const paths: string[] = [];
  page.on('request', (request) => paths.push(new URL(request.url()).pathname));
  return paths;
}

const palette = (page: Page) => page.getByRole('dialog', { name: 'Search' });
const trigger = (page: Page) => page.getByRole('banner').getByRole('button', { name: 'Search' });

test.describe('at desktop width', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the Search button opens the palette, whose script and data load only on first use', async ({ page }) => {
    const requests = recordRequests(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const scriptsBefore = requests.filter((path) => path.endsWith('.js'));
    expect(requests).not.toContain('/palette.json');
    await expect(palette(page)).toBeHidden();

    await trigger(page).click();
    await expect(palette(page)).toBeVisible();
    expect(requests).toContain('/palette.json');
    expect(requests.filter((path) => path.endsWith('.js')).length).toBeGreaterThan(scriptsBefore.length);
  });

  for (const modifier of ['Meta', 'Control']) {
    test(`${modifier}+K opens the palette with focus in the search field`, async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press(`${modifier}+k`);
      await expect(palette(page)).toBeVisible();
      await expect(palette(page).getByRole('combobox', { name: 'Search pages, writing and work' })).toBeFocused();
    });
  }

  test('lists the primary pages and filters them as the user types', async ({ page, request }) => {
    const titles = await paletteTitles(request);
    // The primary pages come first; published content follows them.
    expect(titles.slice(0, 5)).toEqual(['Home', 'About', 'Work', 'Writing', 'Now']);
    await page.goto('/');
    await trigger(page).click();
    const options = palette(page).getByRole('option');
    await expect(options).toHaveText(titles.map(startsWith));
    await expect(palette(page).getByRole('status')).toHaveText(resultCount(titles.length));

    await page.keyboard.type('wr');
    await expect(options).toHaveText([/^Writing/]);
    await expect(palette(page).getByRole('status')).toHaveText('1 result');

    // A fresh query, not "wrzzz": Pagefind's partial matching can find published pages for that.
    await palette(page).getByRole('combobox').fill('zzz');
    await expect(options).toHaveCount(0);
    await expect(palette(page).getByRole('status')).toHaveText('No matches');
  });

  test('arrow keys move the active option and Enter goes to it', async ({ page, request }) => {
    const titles = await paletteTitles(request);
    await page.goto('/');
    await trigger(page).click();
    const input = palette(page).getByRole('combobox');
    const option = (name: string) => palette(page).getByRole('option', { name: new RegExp(`^${name}`) });

    await expect(option('Home')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(option('Work')).toHaveAttribute('aria-selected', 'true');
    await expect(option('Home')).toHaveAttribute('aria-selected', 'false');
    await expect(input).toHaveAttribute('aria-activedescendant', (await option('Work').getAttribute('id'))!);

    // Up from the first option wraps to the last, and down from the last back to the first.
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(option('Home')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowUp');
    const last = palette(page).getByRole('option', { name: startsWith(titles.at(-1)!) });
    await expect(last).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(option('Home')).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(option('Work')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/work');
  });

  test('if the entry list can’t load, the palette says so and points to the navigation', async ({ page }) => {
    await page.route('**/palette.json', (route) => route.abort());
    await page.goto('/');
    await trigger(page).click();
    await expect(palette(page).getByRole('status')).toHaveText('Results couldn’t load. Use the site navigation instead.');
    await expect(palette(page).getByRole('option')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(trigger(page)).toBeFocused();
  });

  test('clicking a result goes to it', async ({ page }) => {
    await page.goto('/');
    await trigger(page).click();
    await palette(page).getByRole('option', { name: /^Writing/ }).click();
    await expect(page).toHaveURL('/writing');
  });

  test('Escape closes the palette and returns focus to the Search button', async ({ page }) => {
    await page.goto('/');
    await trigger(page).click();
    await expect(palette(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(palette(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  test('opened by the shortcut, closing returns focus to the element that had it', async ({ page }) => {
    await page.goto('/');
    const writing = page.getByRole('banner').getByRole('link', { name: 'Writing' });
    await writing.focus();
    await page.keyboard.press('Control+k');
    await expect(palette(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(writing).toBeFocused();
  });

  test('the Close button and a click outside the panel also close it', async ({ page }) => {
    await page.goto('/');
    await trigger(page).click();
    await palette(page).getByRole('button', { name: 'Close' }).click();
    await expect(palette(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();

    await trigger(page).click();
    await expect(palette(page)).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(palette(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  test('Tab keeps focus inside the open palette', async ({ page }) => {
    await page.goto('/');
    await trigger(page).click();
    const input = palette(page).getByRole('combobox');
    const close = palette(page).getByRole('button', { name: 'Close' });
    await expect(input).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(close).toBeFocused();
  });

  test('reopening starts from an empty query', async ({ page, request }) => {
    const titles = await paletteTitles(request);
    await page.goto('/');
    await trigger(page).click();
    await expect(palette(page).getByRole('combobox')).toBeFocused();
    await page.keyboard.type('now');
    await expect(palette(page).getByRole('option')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(palette(page)).toBeHidden();
    await trigger(page).click();
    await expect(palette(page).getByRole('combobox')).toHaveValue('');
    await expect(palette(page).getByRole('option')).toHaveCount(titles.length);
  });

  test('screen readers get the dialog, the field’s purpose, the result list and the result count', async ({
    page,
    request,
  }) => {
    const titles = await paletteTitles(request);
    await page.goto('/');
    await trigger(page).click();
    // A dialog named Search: a native modal <dialog>, so the rest of the page is inert.
    const dialog = palette(page);
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('main')).toHaveJSProperty('inert', false);
    expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
    const input = dialog.getByRole('combobox', { name: 'Search pages, writing and work' });
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = dialog.getByRole('listbox', { name: 'Results' });
    await expect(input).toHaveAttribute('aria-controls', (await listbox.getAttribute('id'))!);
    await expect(dialog.getByRole('status')).toHaveText(resultCount(titles.length));

    await page.keyboard.type('zzz');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  test('the Search button names its shortcut', async ({ page }) => {
    await page.goto('/');
    await expect(trigger(page)).toHaveAttribute('aria-keyshortcuts', 'Meta+K Control+K');
    await expect(trigger(page)).toHaveAttribute('aria-haspopup', 'dialog');
    // The visible shortcut hint is shown beside the label, but kept out of the button's name.
    await expect(trigger(page).locator('kbd')).toBeVisible();
    await expect(trigger(page)).toHaveAccessibleName('Search');
  });
});

test.describe('below 768px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the Search button is the last item of the Menu panel; closing the palette returns focus to Menu', async ({
    page,
  }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    const menu = header.getByRole('button', { name: 'Menu' });
    await expect(trigger(page)).toBeHidden();
    await menu.click();
    await expect(trigger(page)).toBeVisible();
    await expect(trigger(page).locator('kbd')).toBeHidden();

    await trigger(page).click();
    await expect(palette(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(palette(page)).toBeHidden();
    await expect(menu).toBeFocused();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });

  test('there is no Search button and the navigation still works', async ({ page }) => {
    await page.goto('/');
    await expect(trigger(page)).toBeHidden();
    await page.getByRole('banner').getByRole('link', { name: 'Work' }).click();
    await expect(page).toHaveURL('/work');
  });
});
