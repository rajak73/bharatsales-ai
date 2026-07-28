import { defineConfig, devices } from '@playwright/test';

process.env.NEXT_PUBLIC_API_URL = 'http://localhost:6002';
process.env.VITE_API_URL = 'http://localhost:6002';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:6003',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd apps/api && pnpm run dev',
      url: 'http://localhost:6002/health',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'cd apps/web && pnpm run dev',
      url: 'http://localhost:6003',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'cd apps/field-pwa && pnpm run dev',
      url: 'http://localhost:6001',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    }
  ],
});
