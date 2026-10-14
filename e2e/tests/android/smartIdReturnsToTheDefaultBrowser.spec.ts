import { expect, test } from '../../support/test';
import { tapLogInToOpenTheSmartIdApp } from '../../support/loginPage';
import {
  expectToldToLogInHere,
  logInWithTheSmartIdCallbackIn,
  openTheSmartIdCallbackIn,
  tryAgainWhereSmartIdReturnedTheLogin,
} from '../../support/callbackPage';
import { expectLoggedIn, expectLoggedInOn } from '../../support/loggedIn';
import {
  RELEASE_1_TRY_AGAIN_KEEPS_THE_PAGE_THE_LOGIN_STARTED_FROM,
  expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt,
} from '../../support/expectedFailures';
import { PAGE_A_NEWSLETTER_LINKS_TO } from '../../support/links';
import { userAgents } from '../../support/userAgents';

const SAMSUNG_INTERNET = { userAgent: userAgents.samsungInternet };

test.describe('Smart-ID app returns a login started in Chrome to Samsung Internet, the default browser', () => {
  test('tells the person in Samsung Internet to log in there', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const callbackUrl = await smartIdApp.confirmAndReturn(await tapLogInToOpenTheSmartIdApp(page));

    const samsungInternetTab = await openTheSmartIdCallbackIn(
      await anotherBrowser(SAMSUNG_INTERNET),
      callbackUrl,
    );

    await expectToldToLogInHere(samsungInternetTab);
  });

  test('accepts the login Try again starts in Samsung Internet when Smart-ID returns it there', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const samsungInternet = await anotherBrowser(SAMSUNG_INTERNET);
    const callbackUrl = await tryAgainWhereSmartIdReturnedTheLogin(
      page,
      samsungInternet,
      smartIdApp,
    );

    const { callbackAnswer } = await openTheSmartIdCallbackIn(samsungInternet, callbackUrl);

    expect(callbackAnswer.status()).toBe(200);
  });

  test('logs the person in in Samsung Internet after Try again', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const samsungInternet = await anotherBrowser(SAMSUNG_INTERNET);
    const callbackUrl = await tryAgainWhereSmartIdReturnedTheLogin(
      page,
      samsungInternet,
      smartIdApp,
    );

    const { tab, tokenAnswer } = await logInWithTheSmartIdCallbackIn(samsungInternet, callbackUrl);
    expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt(tokenAnswer);

    await expectLoggedIn(tab);
  });

  test('brings the person back to the page they were sent to log in from after Try again in Samsung Internet', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    test.fail(true, RELEASE_1_TRY_AGAIN_KEEPS_THE_PAGE_THE_LOGIN_STARTED_FROM);
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const samsungInternet = await anotherBrowser(SAMSUNG_INTERNET);
    const callbackUrl = await tryAgainWhereSmartIdReturnedTheLogin(
      page,
      samsungInternet,
      smartIdApp,
    );

    const { tab, tokenAnswer } = await logInWithTheSmartIdCallbackIn(samsungInternet, callbackUrl);
    expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt(tokenAnswer);

    await expectLoggedInOn(tab, PAGE_A_NEWSLETTER_LINKS_TO);
  });
});
