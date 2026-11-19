import { defineConfig, devices } from '@playwright/test';

// Not 4321, so a running `astro dev` server is never mistaken for the build.
const port = 4322;

/**
 * Browser tests run against the built site served by `astro preview`, never the
 * dev server, so they exercise exactly what ships. Run `npm run build` first
 * (`npm run verify` does this).
 */
export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'a11y/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // `--ignore-lock` runs a one-off foreground server that skips Astro's lock
    // file. Without it, Astro auto-backgrounds preview when run by a coding
    // agent, and Playwright sees the command exit.
    command: `npx astro preview --port ${port} --ignore-lock`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    stdout: 'ignore',
  },
});
