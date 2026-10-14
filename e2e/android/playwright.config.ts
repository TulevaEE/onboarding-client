import path from 'path';
import { defineConfig } from '@playwright/test';

import { androidEnvironment } from './support/androidEnvironment';

export default defineConfig({
  testDir: './scenarios',
  outputDir: path.join(androidEnvironment.outputDirectory, 'test-results'),
  timeout: 180000,
  expect: { timeout: 30000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [
    ['list'],
    [
      'html',
      { outputFolder: path.join(androidEnvironment.outputDirectory, 'report'), open: 'never' },
    ],
  ],
});
