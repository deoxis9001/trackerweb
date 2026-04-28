import { defineConfig, devices } from '@playwright/test'

// DEV=1 → test against running dev server (port 5173)
// default → build + preview (port 4173)
const DEV_MODE = !!process.env.DEV

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: DEV_MODE ? 'http://localhost:5173' : 'http://localhost:4173',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],

  webServer: DEV_MODE
    ? {
        command: 'npm run dev',
        port: 5173,
        reuseExistingServer: true,
        timeout: 60000,
      }
    : {
        command: 'npx vite preview --port 4173',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
      },
})
