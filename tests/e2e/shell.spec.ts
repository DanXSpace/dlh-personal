import { expect, test, type Page } from '@playwright/test';

/**
 * The expanded state Chromium exposes to assistive technology, read from its
 * accessibility tree. A native popover invoker carries no `aria-expanded`
 * attribute, so the DOM can't answer this (architecture §9).
 */
async function exposedExpandedState(page: Page, buttonName: string): Promise<boolean | undefined> {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  await cdp.detach();
  // Case-insensitive, like Playwright's role queries: Chromium applies `text-transform` to names.
  const button = nodes.find(
    (node) => node.role?.value === 'button' && String(node.name?.value).toLowerCase() === buttonName.toLowerCase(),
  );
  expect(button, `a button named ${buttonName}`).toBeDefined();
  const expanded = button?.properties?.find((property) => property.name === 'expanded');
  return expanded?.value.value as boolean | undefined;
}

test.describe('at desktop width', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the header shows dlh. at the leading edge, then About, Work, Writing, Now, then the theme control', async ({
    page,
  }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    const links = header.getByRole('link');
    await expect(links).toHaveText(['dlh.', 'About', 'Work', 'Writing', 'Now']);
    await expect(links.first()).toHaveAttribute('href', '/');

    const nav = header.getByRole('navigation', { name: 'Main' });
    for (const name of ['About', 'Work', 'Writing', 'Now']) {
      await expect(nav.getByRole('link', { name })).toBeVisible();
    }

    // The theme control follows the navigation in the layout.
    const navBox = await nav.getByRole('link', { name: 'Now' }).boundingBox();
    const themeBox = await header.getByRole('group', { name: 'Theme' }).boundingBox();
    const homeBox = await links.first().boundingBox();
    expect(homeBox!.x).toBeLessThan(navBox!.x);
    expect(navBox!.x).toBeLessThan(themeBox!.x);
  });
});

test.describe('keyboard order at desktop width', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('focus moves from the skip link through dlh., the navigation and the theme control', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    const sequence = [
      page.getByRole('link', { name: 'Skip to content' }),
      header.getByRole('link', { name: 'dlh.' }),
      ...['About', 'Work', 'Writing', 'Now'].map((name) => header.getByRole('link', { name, exact: true })),
      header.getByRole('radio', { name: 'System' }),
    ];
    for (const target of sequence) {
      await page.keyboard.press('Tab');
      await expect(target).toBeFocused();
    }
  });
});

const navLabels = ['About', 'Work', 'Writing', 'Now'];

test.describe('navigation state', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('on the homepage only dlh. is the current page and no section is active', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'dlh.' })).toHaveAttribute('aria-current', 'page');
    for (const name of navLabels) {
      const link = header.getByRole('link', { name, exact: true });
      await expect(link).not.toHaveAttribute('aria-current');
      await expect(link).toHaveCSS('text-decoration-line', 'none');
    }
  });

  // Section routes arrive in later tickets; each case runs once its route is built.
  const cases = [
    { path: '/about', active: 'About', exact: true },
    { path: '/work', active: 'Work', exact: true },
    { path: '/writing', active: 'Writing', exact: true },
    { path: '/now', active: 'Now', exact: true },
    { path: '/writing/category/engineering', active: 'Writing', exact: false },
  ];

  for (const { path, active, exact } of cases) {
    test(`on ${path} ${active} is ${exact ? 'the current page' : 'the active parent section'}`, async ({ page }) => {
      const response = await page.goto(path);
      test.skip(response?.status() === 404, `${path} is not built yet`);

      const header = page.getByRole('banner');
      await expect(header.getByRole('link', { name: 'dlh.' })).not.toHaveAttribute('aria-current');
      for (const name of navLabels) {
        const link = header.getByRole('link', { name, exact: true });
        if (name === active) {
          if (exact) await expect(link).toHaveAttribute('aria-current', 'page');
          else await expect(link).not.toHaveAttribute('aria-current');
          // The non-color cue.
          await expect(link).toHaveCSS('text-decoration-line', 'underline');
        } else {
          await expect(link).not.toHaveAttribute('aria-current');
          await expect(link).toHaveCSS('text-decoration-line', 'none');
        }
      }
    });
  }
});

test.describe('below 768px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the navigation collapses behind a Menu disclosure operable by keyboard', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    const menu = header.getByRole('button', { name: 'Menu' });
    const about = header.getByRole('link', { name: 'About' });

    await expect(header.getByRole('link', { name: 'dlh.' })).toBeVisible();
    await expect(header.getByRole('group', { name: 'Theme' })).toBeVisible();
    await expect(about).toBeHidden();
    expect(await exposedExpandedState(page, 'Menu')).toBe(false);

    await page.keyboard.press('Tab'); // skip link
    await page.keyboard.press('Tab'); // dlh.
    await page.keyboard.press('Tab');
    await expect(menu).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(about).toBeVisible();
    expect(await exposedExpandedState(page, 'Menu')).toBe(true);

    await page.keyboard.press('Tab');
    await expect(about).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(about).toBeHidden();
    await expect(menu).toBeFocused();
    expect(await exposedExpandedState(page, 'Menu')).toBe(false);
  });
});

test('the skip link is the first focusable element and moves focus to the main content', async ({ page }) => {
  await page.goto('/');
  const skip = page.getByRole('link', { name: 'Skip to content' });

  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('the footer shows the copyright and no contact or professional links while none are supplied', async ({
  page,
}) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer).toContainText(/© \d{4} Daniel Lee Holung/);
  for (const name of ['Email', 'GitHub', 'LinkedIn']) {
    await expect(page.getByRole('link', { name })).toHaveCount(0);
  }
});

interface Stripe {
  background: string;
  keyline: string | null;
}

/** Each signature stripe's fill and, when one is drawn, its keyline color. */
async function signatureStripes(page: Page): Promise<Stripe[]> {
  return page.locator('[data-heritage-signature] > *').evaluateAll((stripes) =>
    stripes.map((stripe) => {
      const style = getComputedStyle(stripe);
      const visible = style.outlineStyle !== 'none' && style.outlineWidth !== '0px' && !style.outlineColor.endsWith(', 0)');
      return { background: style.backgroundColor, keyline: visible ? style.outlineColor : null };
    }),
  );
}

/** WCAG relative luminance of an `rgb(r, g, b)` string. */
function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map((channel) => {
    const c = Number(channel) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

// Heritage colors from docs/design-spec.md §2.
const green = 'rgb(0, 155, 58)';
const gold = 'rgb(254, 209, 0)';
const black = 'rgb(0, 0, 0)';

test('the heritage signature is three decorative stripes hidden from assistive technology', async ({ page }) => {
  await page.goto('/');
  const signature = page.getByRole('contentinfo').locator('[data-heritage-signature]');
  await expect(signature).toHaveAttribute('aria-hidden', 'true');
  await expect(signature).toBeVisible();
  expect((await signatureStripes(page)).map((stripe) => stripe.background)).toEqual([green, gold, black]);
});

test('in light mode only the gold stripe has a keyline, darker than the gold', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const [greenStripe, goldStripe, blackStripe] = await signatureStripes(page);
  expect(greenStripe!.keyline).toBeNull();
  expect(blackStripe!.keyline).toBeNull();
  expect(goldStripe!.keyline).not.toBeNull();
  expect(luminance(goldStripe!.keyline!)).toBeLessThan(luminance(gold));
});

test('in dark mode only the black stripe has a keyline, lighter than the black', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const [greenStripe, goldStripe, blackStripe] = await signatureStripes(page);
  expect(greenStripe!.keyline).toBeNull();
  expect(goldStripe!.keyline).toBeNull();
  expect(blackStripe!.keyline).not.toBeNull();
  expect(luminance(blackStripe!.keyline!)).toBeGreaterThan(luminance(black));
});

test('an unknown route serves the custom 404 page inside the shell with a clear way home', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);

  await expect(page).toHaveTitle('Page not found — Daniel Lee Holung');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Page not found.');
  await expect(main.getByText('404', { exact: true })).toBeVisible();
  const home = main.getByRole('link', { name: 'Back to home' });
  await expect(home).toHaveAttribute('href', '/');

  await home.click();
  await expect(page).toHaveURL('/');
});

test.describe('below 768px without JavaScript', () => {
  test.use({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });

  test('the Menu disclosure still opens the navigation', async ({ page }) => {
    await page.goto('/');
    const about = page.getByRole('banner').getByRole('link', { name: 'About' });
    await expect(about).toBeHidden();
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(about).toBeVisible();
  });
});
