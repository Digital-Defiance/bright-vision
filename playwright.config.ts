import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  testIgnore: ['**/hello-llm.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'sh scripts/e2e-preview.sh',
    url: 'http://127.0.0.1:4173',
    // Always start preview with E2E=1 (no :8741 proxy). Reusing an old preview causes proxy spam.
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
