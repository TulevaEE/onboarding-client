import { BrowserContext, Page, Response, expect } from '@playwright/test';

import {
  TokenAnswer,
  finalTokenAnswer,
  isSmartIdCallback,
  showTheSmartIdQrCodeOnThePhone,
  tapLogInToOpenTheSmartIdApp,
  web2AppLinkOpenedBy,
} from './loginPage';
import { SmartIdApp } from './smartIdApp';

export type ReturnedTab = { tab: Page; callbackAnswer: Response };

const SESSION_THE_LOGIN_STARTED_IN_IS_MISSING = 'auth.session.not.found';

const TOLD_TO_LOG_IN_IN_THE_BROWSER_SMART_ID_OPENED =
  /Smart.ID avas Tuleva teises brauseris või aknas\. Vajuta .Proovi uuesti.\. Privaatses aknas sisselogimine ei õnnestu\./;

const tryAgainLinkOf = (tab: Page) => tab.getByRole('link', { name: 'Proovi uuesti' });

export async function openTheSmartIdCallbackIn(
  browser: BrowserContext,
  callbackUrl: string,
): Promise<ReturnedTab> {
  const tab = await browser.newPage();
  const callbackAnswer = tab.waitForResponse(isSmartIdCallback);
  await tab.goto(callbackUrl);
  return { tab, callbackAnswer: await callbackAnswer };
}

export async function logInWithTheSmartIdCallbackIn(
  browser: BrowserContext,
  callbackUrl: string,
): Promise<{ tab: Page; tokenAnswer: TokenAnswer }> {
  const tab = await browser.newPage();
  const tokenAnswer = finalTokenAnswer(tab);
  await tab.goto(callbackUrl);
  return { tab, tokenAnswer: await tokenAnswer };
}

export async function expectToldToLogInHere(
  { tab, callbackAnswer }: ReturnedTab,
  whyTheCallbackWasRefused: string = SESSION_THE_LOGIN_STARTED_IN_IS_MISSING,
): Promise<void> {
  expect(await callbackAnswer.json()).toEqual({
    errors: [expect.objectContaining({ code: whyTheCallbackWasRefused })],
  });
  await expect(tab.getByRole('alert')).toHaveText(TOLD_TO_LOG_IN_IN_THE_BROWSER_SMART_ID_OPENED);
  await expect(tryAgainLinkOf(tab)).toBeVisible();
}

export const tapTryAgainToOpenTheSmartIdApp = (tab: Page): Promise<string> =>
  web2AppLinkOpenedBy(tab, () => tryAgainLinkOf(tab).click());

export async function tryAgainWhereSmartIdReturnedTheLogin(
  startingTab: Page,
  returningBrowser: BrowserContext,
  smartIdApp: SmartIdApp,
): Promise<string> {
  const callbackUrl = await smartIdApp.confirmAndReturn(
    await tapLogInToOpenTheSmartIdApp(startingTab),
  );
  const returned = await openTheSmartIdCallbackIn(returningBrowser, callbackUrl);
  await expectToldToLogInHere(returned);
  return smartIdApp.confirmAndReturn(await tapTryAgainToOpenTheSmartIdApp(returned.tab));
}

export async function finishTheLoginByQrCodeAfterTryingAgainWhereSmartIdReturnedIt(
  startingTab: Page,
  returningBrowser: BrowserContext,
  smartIdApp: SmartIdApp,
): Promise<Page> {
  const callbackUrl = await smartIdApp.confirmAndReturn(
    await tapLogInToOpenTheSmartIdApp(startingTab),
  );
  const returned = await openTheSmartIdCallbackIn(returningBrowser, callbackUrl);
  await expectToldToLogInHere(returned);
  await tapTryAgainToOpenTheSmartIdApp(returned.tab);
  await returned.tab.getByRole('button', { name: 'Katkestan' }).click();
  await smartIdApp.confirm(await showTheSmartIdQrCodeOnThePhone(returned.tab));
  return returned.tab;
}
