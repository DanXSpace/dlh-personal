import { expect, test } from '@playwright/test';

test('Geist Sans and Geist Mono are served from the site itself, with only the sans 400 file preloaded', async ({
  page,
  baseURL,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');

  const preloads = page.locator('link[rel="preload"][as="font"]');
  await expect(preloads).toHaveCount(1);
  const preloadHref = await preloads.getAttribute('href');

  const { preloadedFaces, bodyFont, monoFont } = await page.evaluate((href) => {
    const fontFaces = [...document.styleSheets].flatMap((sheet) =>
      [...sheet.cssRules].filter((rule): rule is CSSFontFaceRule => rule instanceof CSSFontFaceRule),
    );
    const probe = document.createElement('code');
    document.body.append(probe);
    const monoFont = getComputedStyle(probe).fontFamily;
    probe.remove();
    return {
      preloadedFaces: fontFaces
        .filter((rule) => rule.style.getPropertyValue('src').includes(href ?? ''))
        .map((rule) => ({
          family: rule.style.getPropertyValue('font-family'),
          weight: rule.style.getPropertyValue('font-weight'),
          style: rule.style.getPropertyValue('font-style'),
        })),
      bodyFont: getComputedStyle(document.body).fontFamily,
      monoFont,
    };
  }, preloadHref);

  // Astro registers each family under a hashed name, e.g. `Geist-1d95…`.
  expect(bodyFont).toMatch(/^"?Geist-/);
  expect(monoFont).toMatch(/^"?Geist Mono-/);
  expect(preloadedFaces).toEqual([{ family: expect.stringMatching(/^"?Geist-/), weight: '400', style: 'normal' }]);

  const preloadUrl = new URL(preloadHref ?? '', baseURL);
  expect(preloadUrl.origin).toBe(new URL(baseURL ?? '').origin);
  expect(requests.filter((url) => new URL(url).origin !== new URL(baseURL ?? '').origin)).toEqual([]);
  expect(requests).toContain(preloadUrl.href);
});

test('the page loads without content security policy violations', async ({ page }) => {
  await page.addInitScript(() => {
    const violations: string[] = [];
    (window as unknown as { cspViolations: string[] }).cspViolations = violations;
    document.addEventListener('securitypolicyviolation', (event) => {
      violations.push(`${event.violatedDirective}: ${event.blockedURI || event.sample}`);
    });
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations)).toEqual([]);
});
