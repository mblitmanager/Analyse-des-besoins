import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './generated-tests',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html' }]
  ],
  use: {
    baseURL: 'https://ns-conseil-ab.mbl-service.com',
    trace: 'off',
    screenshot: 'off',
    viewport: { width: 1280, height: 720 },
    launchArgs: ['--disable-gpu', '--no-sandbox'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 60000, // 1 minute
});
