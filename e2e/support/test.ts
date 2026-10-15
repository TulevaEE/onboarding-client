import {
  APIRequestContext,
  BrowserContext,
  BrowserContextOptions,
  test as base,
} from '@playwright/test';

import { anotherBrowserOnThisDevice } from './browsers';
import { behaveLikeANormalSafariTab } from './safariTabs';
import { SmartIdApp, smartIdAppOf } from './smartIdApp';

type OpenAnotherBrowser = (overrides?: BrowserContextOptions) => Promise<BrowserContext>;

export const test = base.extend<{
  privateSafariTabs: boolean;
  smartIdMockService: APIRequestContext;
  smartIdApp: SmartIdApp;
  anotherBrowser: OpenAnotherBrowser;
}>({
  privateSafariTabs: [false, { option: true }],
  context: async ({ context, privateSafariTabs }, use) => {
    if (!privateSafariTabs) {
      await context.addInitScript(behaveLikeANormalSafariTab);
    }
    await use(context);
  },
  smartIdMockService: async ({ playwright }, use) => {
    const mockService = await playwright.request.newContext();
    await use(mockService);
    await mockService.dispose();
  },
  smartIdApp: async ({ smartIdMockService }, use) => {
    await use(smartIdAppOf(smartIdMockService));
  },
  anotherBrowser: async ({ browser, privateSafariTabs }, use, testInfo) => {
    const opened: BrowserContext[] = [];
    await use(async (overrides = {}) => {
      const another = await anotherBrowserOnThisDevice(browser, testInfo, overrides);
      if (!privateSafariTabs) {
        await another.addInitScript(behaveLikeANormalSafariTab);
      }
      opened.push(another);
      return another;
    });
    await Promise.all(opened.map((another) => another.close()));
  },
});

export { expect } from '@playwright/test';
