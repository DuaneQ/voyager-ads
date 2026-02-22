import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for end-to-end UI tests.
 *
 * When PLAYWRIGHT_BASE_URL is set (preview job in CI), tests run against the
 * live Vercel preview deployment — no web server is started.
 * Otherwise the Vite dev server is started automatically.
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const previewUrl = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: previewUrl ?? 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Only start the dev server when NOT running against a preview URL */
  webServer: previewUrl
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
})
