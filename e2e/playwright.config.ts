import { defineConfig, devices } from '@playwright/test';

import { environment } from './support/environment';
import { userAgents } from './support/userAgents';

const IPHONE_SCENARIOS = /tests\/(phone|iphone)\/.*\.spec\.ts$/;
const ANDROID_SCENARIOS = /tests\/(phone|android)\/.*\.spec\.ts$/;
const COMPUTER_SCENARIOS = /tests\/desktop\/.*\.spec\.ts$/;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  timeout: 120000,
  expect: { timeout: 30000 },
  workers: Number(process.env.E2E_WORKERS ?? 2),
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],
  use: {
    baseURL: environment.baseUrl,
    locale: 'et-EE',
    timezoneId: 'Europe/Tallinn',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'iphone-safari',
      testMatch: IPHONE_SCENARIOS,
      use: { ...devices['iPhone 15'], userAgent: userAgents.iPhoneSafariIos26 },
    },
    {
      name: 'android-chrome',
      testMatch: ANDROID_SCENARIOS,
      use: { ...devices['Pixel 7'], userAgent: userAgents.androidChrome },
    },
    {
      name: 'desktop-chrome',
      testMatch: COMPUTER_SCENARIOS,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
