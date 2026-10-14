import { Browser, BrowserContext, BrowserContextOptions, TestInfo } from '@playwright/test';

const optionsOfThisDevice = ({ project: { use } }: TestInfo): BrowserContextOptions => ({
  baseURL: use.baseURL,
  userAgent: use.userAgent,
  viewport: use.viewport,
  screen: use.screen,
  deviceScaleFactor: use.deviceScaleFactor,
  isMobile: use.isMobile,
  hasTouch: use.hasTouch,
  locale: use.locale,
  timezoneId: use.timezoneId,
  ignoreHTTPSErrors: use.ignoreHTTPSErrors,
});

export async function anotherBrowserOnThisDevice(
  browser: Browser,
  testInfo: TestInfo,
  overrides: BrowserContextOptions = {},
): Promise<BrowserContext> {
  return browser.newContext({ ...optionsOfThisDevice(testInfo), ...overrides });
}
