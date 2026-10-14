import {
  APIRequestContext,
  BrowserContext,
  BrowserContextOptions,
  test as base,
} from '@playwright/test';

import { anotherBrowserOnThisDevice } from './browsers';
import { SmartIdApp, smartIdAppOf } from './smartIdApp';

type OpenAnotherBrowser = (overrides?: BrowserContextOptions) => Promise<BrowserContext>;

export const test = base.extend<{
  smartIdMockService: APIRequestContext;
  smartIdApp: SmartIdApp;
  anotherBrowser: OpenAnotherBrowser;
}>({
  smartIdMockService: async ({ playwright }, use) => {
    const mockService = await playwright.request.newContext();
    await use(mockService);
    await mockService.dispose();
  },
  smartIdApp: async ({ smartIdMockService }, use) => {
    await use(smartIdAppOf(smartIdMockService));
  },
  anotherBrowser: async ({ browser }, use, testInfo) => {
    const opened: BrowserContext[] = [];
    await use(async (overrides = {}) => {
      const another = await anotherBrowserOnThisDevice(browser, testInfo, overrides);
      opened.push(another);
      return another;
    });
    await Promise.all(opened.map((another) => another.close()));
  },
});

export { expect } from '@playwright/test';
