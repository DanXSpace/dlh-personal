import { expect, test } from '@playwright/test';

// The test build leaves PUBLIC_SITE_ENV unset, so it must behave like a preview.

test('pages in a non-production build tell crawlers not to index or follow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('robots.txt in a non-production build disallows all crawling', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  expect(await response.text()).toBe('User-agent: *\nDisallow: /\n');
});

test('pages carry a content security policy that hashes inline code instead of allowing it', async ({
  page,
}) => {
  await page.goto('/');
  const policy = await page
    .locator('meta[http-equiv="content-security-policy"]')
    .getAttribute('content');

  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toMatch(/script-src [^;]*'self'/);
  expect(policy).not.toContain("'unsafe-inline'");
});

// Astro hashes the scripts it bundles but not `<script is:inline>` (checked in
// Astro 7.4). This catches any inline script, such as theme init, that ships
// without its hash in the policy and would be blocked or left uncovered.
test('every inline script on the page has its hash in the content security policy', async ({
  page,
}) => {
  await page.goto('/');
  const { policy, missing } = await page.evaluate(async () => {
    const policy =
      document.querySelector('meta[http-equiv="content-security-policy"]')?.getAttribute('content') ?? '';
    const missing: string[] = [];
    for (const script of document.querySelectorAll('script:not([src])')) {
      if (script.getAttribute('type') === 'application/ld+json') continue;
      const bytes = new TextEncoder().encode(script.textContent ?? '');
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
      const hash = `'sha256-${btoa(String.fromCharCode(...digest))}'`;
      if (!policy.includes(hash)) missing.push(hash);
    }
    return { policy, missing };
  });

  expect(policy).not.toBe('');
  expect(missing).toEqual([]);
});
