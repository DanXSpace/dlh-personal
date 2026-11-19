import { defineConfig, devices } from '@playwright/test';

// Not 4321, so a running `astro dev` server is never mistaken for the build.
// `PW_PORT` overrides it so parallel checkouts can run browser tests at once.
const port = Number(process.env['PW_PORT'] ?? 4322);
// The fixture build (ADR-0004), served from `dist-fixtures/` on its own port.
const fixturesPort = Number(process.env['PW_FIXTURES_PORT'] ?? port + 1);

// `--ignore-lock` runs a one-off foreground server that skips Astro's lock
// file. Without it, Astro auto-backgrounds preview when run by a coding agent,
// and Playwright sees the command exit.
const preview = (listenOn: number) => `npx astro preview --port ${listenOn} --ignore-lock`;

/**
 * Browser tests run against built sites served by `astro preview`, never the
 * dev server, so they exercise exactly what ships. Run `npm run build` and
 * `npm run build:fixtures` first (`npm run verify` does both).
 *
 * `*.fixtures.spec.ts` files test templates against fixture content in the
 * fixture build. Everything else tests the production build.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'a11y/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/*.fixtures.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${port}` },
    },
    {
      name: 'fixtures',
      testMatch: '**/*.fixtures.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${fixturesPort}` },
    },
  ],
  webServer: [
    {
      command: preview(port),
      url: `http://localhost:${port}`,
      reuseExistingServer: false,
      stdout: 'ignore',
    },
    {
      command: preview(fixturesPort),
      env: { CONTENT_SOURCE: 'fixtures' },
      url: `http://localhost:${fixturesPort}`,
      reuseExistingServer: false,
      stdout: 'ignore',
    },
  ],
});
