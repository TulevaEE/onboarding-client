import { Locator, Page, expect } from '@playwright/test';

import { environment } from './environment';
import { logInButtonOf } from './loginPage';

export const OPEN_IN_THE_BROWSER = 'Ava brauseris';
const SMART_ID_DOES_NOT_WORK_INSIDE_THE_APP = /^Smart.ID ei tööta selle rakenduse sees\.$/;

const RENDERED_WITH_THE_LOGIN_TAB_MILLIS = 5000;
const LINKS_THAT_LEAVE_AN_IN_APP_BROWSER =
  'a[href^="intent:"], a[href^="x-safari-https:"], a[href^="instagram:"]';

export const expectRenderedWithTheLoginTab = expect.configure({
  timeout: RENDERED_WITH_THE_LOGIN_TAB_MILLIS,
});

export type WayOut = { description: string; address: string; openedBy: 'link' | 'window.open' };

type RecordsWindowOpen = { addressesWindowOpenOpened: string[] };

const hostOfTheTestedSite = new URL(environment.baseUrl).host;

const httpsAddressOf = (pathAndQuery: string): string =>
  `https://${hostOfTheTestedSite}${pathAndQuery}`;

const safariAddressOf = (pathAndQuery: string): string =>
  `x-safari-https://${hostOfTheTestedSite}${pathAndQuery}`;

export const safariLinkTo = (pathAndQuery: string): WayOut => ({
  description: 'in Safari through an x-safari-https link',
  address: safariAddressOf(pathAndQuery),
  openedBy: 'link',
});

export const safariWindowOpenTo = (pathAndQuery: string): WayOut => ({
  description: "in Safari through window.open('x-safari-https://…')",
  address: safariAddressOf(pathAndQuery),
  openedBy: 'window.open',
});

export const instagramExternalBrowserLinkTo = (pathAndQuery: string): WayOut => ({
  description: 'in the default browser through an instagram://extbrowser link',
  address: `instagram://extbrowser/?url=${encodeURIComponent(httpsAddressOf(pathAndQuery))}`,
  openedBy: 'link',
});

export const androidIntentLinkTo = (pathAndQuery: string): WayOut => ({
  description: 'in the default browser through an intent link without a package',
  address: [
    `intent://${hostOfTheTestedSite}${pathAndQuery}#Intent`,
    'scheme=https',
    'action=android.intent.action.VIEW',
    'category=android.intent.category.BROWSABLE',
    `S.browser_fallback_url=${encodeURIComponent(httpsAddressOf(pathAndQuery))}`,
    'end',
  ].join(';'),
  openedBy: 'link',
});

const controlNamed = (smartIdTab: Locator, name: string): Locator =>
  smartIdTab.getByRole('link', { name }).or(smartIdTab.getByRole('button', { name }));

const recordTheAddressesWindowOpenOpens = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const recorder = window as unknown as Window & RecordsWindowOpen;
    recorder.addressesWindowOpenOpened = [];
    recorder.open = (url?: string | URL) => {
      recorder.addressesWindowOpenOpened.push(String(url));
      return null;
    };
  });

const addressesWindowOpenOpened = (page: Page): Promise<string[]> =>
  page.evaluate(() => (window as unknown as RecordsWindowOpen).addressesWindowOpenOpened);

async function expectTheLinkToLeadTo(smartIdTab: Locator, address: string): Promise<void> {
  await expectRenderedWithTheLoginTab(
    smartIdTab.getByRole('link', { name: OPEN_IN_THE_BROWSER }),
  ).toHaveAttribute('href', address);
}

async function expectWindowOpenToOpen(
  page: Page,
  smartIdTab: Locator,
  address: string,
): Promise<void> {
  const openInTheBrowser = controlNamed(smartIdTab, OPEN_IN_THE_BROWSER);
  await expectRenderedWithTheLoginTab(openInTheBrowser).toBeVisible();
  await recordTheAddressesWindowOpenOpens(page);
  await openInTheBrowser.click();
  await expect.poll(() => addressesWindowOpenOpened(page)).toEqual([address]);
}

export async function expectToBeOfferedTheWayOut(
  page: Page,
  smartIdTab: Locator,
  { address, openedBy }: WayOut,
): Promise<void> {
  if (openedBy === 'window.open') {
    await expectWindowOpenToOpen(page, smartIdTab, address);
  } else {
    await expectTheLinkToLeadTo(smartIdTab, address);
  }
}

export async function expectNoWayOutOfTheBrowser(page: Page, smartIdTab: Locator): Promise<void> {
  await expect(logInButtonOf(smartIdTab)).toBeVisible();
  await expect(page.getByText(OPEN_IN_THE_BROWSER, { exact: true })).toHaveCount(0);
  await expect(page.locator(LINKS_THAT_LEAVE_AN_IN_APP_BROWSER)).toHaveCount(0);
}

export async function expectNoSmartIdLoginInsideTheApp(smartIdTab: Locator): Promise<void> {
  await expectRenderedWithTheLoginTab(
    smartIdTab.getByText(SMART_ID_DOES_NOT_WORK_INSIDE_THE_APP),
  ).toBeVisible();
  await expect(logInButtonOf(smartIdTab)).toHaveCount(0);
}
