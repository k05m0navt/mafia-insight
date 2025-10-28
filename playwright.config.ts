import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: 'html',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
      testIgnore: [
        /.*cross-browser\/.*\.spec\.ts/,
        /.*chrome\.spec\.ts/,
        /.*firefox\.spec\.ts/,
        /.*safari\.spec\.ts/,
      ],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.ts/,
      testIgnore: [
        /.*cross-browser\/.*\.spec\.ts/,
        /.*chrome\.spec\.ts/,
        /.*firefox\.spec\.ts/,
        /.*safari\.spec\.ts/,
      ],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.spec\.ts/,
      testIgnore: [
        /.*cross-browser\/.*\.spec\.ts/,
        /.*chrome\.spec\.ts/,
        /.*firefox\.spec\.ts/,
        /.*safari\.spec\.ts/,
      ],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*mobile.*\.spec\.ts/,
    },
  ],

  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
