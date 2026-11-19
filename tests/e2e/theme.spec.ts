import { expect, test, type Page } from '@playwright/test';

// Approved values from docs/design-spec.md §2 (the independent source of truth).
const palette = {
  light: {
    '--color-bg': '#FAFAF8',
    '--color-surface': '#F1F1EE',
    '--color-text': '#171717',
    '--color-muted': '#595959',
    '--color-rule': '#D6D6D2',
    '--color-control-border': '#767676',
    '--color-link': '#171717',
    '--color-focus': '#171717',
  },
  dark: {
    '--color-bg': '#171717',
    '--color-surface': '#222222',
    '--color-text': '#F4F4F2',
    '--color-muted': '#B5B5B5',
    '--color-rule': '#414141',
    '--color-control-border': '#858585',
    '--color-link': '#F4F4F2',
    '--color-focus': '#F4F4F2',
  },
} as const;

type Theme = keyof typeof palette;

/** Resolves colors through the browser so `#222222` and a minified `#222` compare equal. */
async function resolveColors(page: Page, values: Record<string, string>): Promise<Record<string, string>> {
  return page.evaluate((entries) => {
    const probe = document.createElement('i');
    document.documentElement.append(probe);
    const resolved = entries.map(([name, value]) => {
      probe.style.color = value;
      return [name, getComputedStyle(probe).color];
    });
    probe.remove();
    return Object.fromEntries(resolved);
  }, Object.entries(values));
}

async function expectTheme(page: Page, theme: Theme) {
  const tokens = Object.fromEntries(Object.keys(palette[theme]).map((name) => [name, `var(${name})`]));
  expect(await resolveColors(page, tokens)).toEqual(await resolveColors(page, palette[theme]));
}

for (const os of ['light', 'dark'] as const) {
  test(`a first visit follows the ${os} OS theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: os });
    await page.goto('/');
    await expectTheme(page, os);
  });
}

/**
 * Records `data-theme` on <html> at the moment <body> is inserted, before
 * anything in the body can be painted.
 */
async function recordThemeBeforeBody(page: Page) {
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (!document.body) return;
      (window as unknown as { themeAtBody: string | null }).themeAtBody =
        document.documentElement.getAttribute('data-theme');
      observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
}

async function themeAtBody(page: Page) {
  return page.evaluate(() => (window as unknown as { themeAtBody: string | null }).themeAtBody);
}

test('an explicit choice persists across reload and navigation and applies before first paint', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await recordThemeBeforeBody(page);
  await page.goto('/');

  await page.getByRole('radio', { name: 'Dark' }).click();
  await expectTheme(page, 'dark');

  await page.reload();
  expect(await themeAtBody(page)).toBe('dark');
  await expectTheme(page, 'dark');
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();

  await page.goto('/this-page-does-not-exist');
  expect(await themeAtBody(page)).toBe('dark');
  await expectTheme(page, 'dark');
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
});

test('OS theme changes apply live while System is selected, and not after an explicit choice', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();

  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'dark');

  await page.getByRole('radio', { name: 'Light' }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'light');

  await page.getByRole('radio', { name: 'System' }).click();
  await expectTheme(page, 'dark');
  await page.reload();
  await expectTheme(page, 'dark');
  await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
});

test('the theme control is a named group of System, Light and Dark operable by keyboard', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');

  const group = page.getByRole('group', { name: 'Theme' });
  const radios = group.getByRole('radio');
  await expect(radios).toHaveCount(3);
  for (const [index, name] of ['System', 'Light', 'Dark'].entries()) {
    await expect(radios.nth(index)).toHaveAccessibleName(name);
  }

  // The control follows the skip link, home link, navigation and Search button in tab order.
  const system = group.getByRole('radio', { name: 'System' });
  await expect(async () => {
    await page.keyboard.press('Tab');
    await expect(system).toBeFocused({ timeout: 100 });
  }).toPass({ intervals: [0], timeout: 5000 });
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(group.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expectTheme(page, 'dark');

  await page.keyboard.press('ArrowLeft');
  await expect(group.getByRole('radio', { name: 'Light' })).toBeChecked();
  await expectTheme(page, 'light');
});

test('each theme option is at least a 44 × 44 px target', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  for (const radio of await page.getByRole('radio').all()) {
    const box = await radio.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test.describe('on a touch device', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('tapping a theme option selects it', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.getByRole('radio', { name: 'Dark' }).tap();
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expectTheme(page, 'dark');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, colorScheme: 'dark' });

  test('the site follows the OS theme and the theme control is hidden', async ({ page }) => {
    await page.goto('/');
    await expectTheme(page, 'dark');
    await expect(page.getByRole('group', { name: 'Theme' })).toBeHidden();
  });
});

test('theme option transitions are removed under reduced motion', async ({ page }) => {
  const label = page.locator('label').filter({ hasText: 'Light' });
  const duration = () => label.evaluate((element) => getComputedStyle(element).transitionDuration);

  await page.goto('/');
  expect(await duration()).not.toBe('0s');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await duration()).toBe('0s');
});
