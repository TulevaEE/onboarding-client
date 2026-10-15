import { expect } from '@playwright/test';

import { environment } from '../../support/environment';
import { SmartIdApp } from '../../support/smartIdApp';
import { OPEN_IN_THE_BROWSER } from '../../support/wayOutOfInAppBrowsers';
import { LoginExchange, LoginTraffic } from './loginTraffic';
import { Browser, CHROME, Phone, withoutScheme } from './phone';
import { anyOf, findNode } from './screen';

export const LOG_IN = 'Sisenen';
const SHOW_THE_QR_CODE = 'Näita QR-koodi';
const SCAN_WITH_THE_SMART_ID_APP = /^Skänni Smart.ID rakendusega$/;
export const TRY_AGAIN = 'Proovi uuesti';
export const SK_PAGE_WHEN_THE_SMART_ID_APP_DOES_NOT_OPEN = 'Ei saanud avada Smart-ID rakendust!';

const SKIP_LINK_OF_THE_LOGGED_IN_PAGES = 'Liigu edasi sisu juurde';
const SAMSUNG_INTERNET_OFFERS_TO_BECOME_THE_DEFAULT_BROWSER =
  'Make Samsung Browser your default browser?';
const KEEP_THE_DEFAULT_BROWSER = 'Not now';
const LONGEST_LOGIN_COMPLETION_MILLIS = 20000;

export const addressOf = (pathAndQuery: string): string => `${environment.baseUrl}${pathAndQuery}`;

const pathnameOf = (addressWithoutScheme: string): string =>
  new URL(`http://${addressWithoutScheme}`).pathname;

export async function expectLoggedIn(phone: Phone): Promise<void> {
  await phone.waitFor(SKIP_LINK_OF_THE_LOGGED_IN_PAGES, LONGEST_LOGIN_COMPLETION_MILLIS);
  expect(await phone.isShown(LOG_IN)).toBe(false);
}

export async function expectLoggedInOn(phone: Phone, pathname: string): Promise<void> {
  await expectLoggedIn(phone);
  expect(pathnameOf(await phone.addressInTheBar())).toBe(pathname);
}

async function keepTheDefaultBrowserWhenAsked(phone: Phone): Promise<void> {
  const shown = await phone.waitFor(
    anyOf(LOG_IN, SAMSUNG_INTERNET_OFFERS_TO_BECOME_THE_DEFAULT_BROWSER),
  );
  if (shown.text === SAMSUNG_INTERNET_OFFERS_TO_BECOME_THE_DEFAULT_BROWSER) {
    await phone.tap(KEEP_THE_DEFAULT_BROWSER);
  }
}

export async function expectNoWayOutOfThisBrowser(phone: Phone): Promise<void> {
  await phone.waitFor(LOG_IN);
  const nodes = await phone.screen();
  expect(findNode(nodes, OPEN_IN_THE_BROWSER)).toBeUndefined();
}

export async function expectTheBrowserToShowTheSmartIdAppLink(
  phone: Phone,
  web2AppLink: string,
): Promise<void> {
  await phone.waitFor(SK_PAGE_WHEN_THE_SMART_ID_APP_DOES_NOT_OPEN);
  expect([withoutScheme(web2AppLink), new URL(web2AppLink).host]).toContain(
    await phone.addressInTheBar(),
  );
}

export async function tapLogInToOpenTheSmartIdApp(
  phone: Phone,
  loginTraffic: LoginTraffic,
  browser: Browser,
  pathAndQuery: string,
): Promise<LoginExchange & { web2AppLink: string }> {
  await phone.step(`open ${pathAndQuery} in ${browser.name}`, async () => {
    await phone.open(addressOf(pathAndQuery), browser);
    await keepTheDefaultBrowserWhenAsked(phone);
    await expectNoWayOutOfThisBrowser(phone);
  });

  const started = loginTraffic.mark();
  return phone.step(`tap ${LOG_IN} in ${browser.name}`, async () => {
    await phone.tap(LOG_IN);
    const start = await loginTraffic.web2AppLinkSince(started);
    await expectTheBrowserToShowTheSmartIdAppLink(phone, start.web2AppLink);
    expect(await phone.foregroundApp()).toBe(browser.packageName);
    return start;
  });
}

export async function logInWithTheQrCodeInChrome(
  phone: Phone,
  loginTraffic: LoginTraffic,
  smartIdApp: SmartIdApp,
  pathname: string,
): Promise<void> {
  await phone.step(`open ${pathname} in Chrome`, async () => {
    await phone.open(addressOf(pathname), CHROME);
    await phone.waitFor(SHOW_THE_QR_CODE);
  });

  const shown = loginTraffic.mark();
  await phone.step(`tap ${SHOW_THE_QR_CODE}`, async () => {
    await phone.tap(SHOW_THE_QR_CODE);
    await phone.waitFor(SCAN_WITH_THE_SMART_ID_APP);
  });

  await phone.step('scan the QR code with the Smart-ID app', async () => {
    await smartIdApp.confirm(await loginTraffic.newestQrCodeLinkSince(shown));
    await expectLoggedInOn(phone, pathname);
  });
}
