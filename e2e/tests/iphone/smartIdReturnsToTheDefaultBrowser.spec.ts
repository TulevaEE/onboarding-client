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

const CHROME = { userAgent: userAgents.iPhoneChrome };

test.describe('Smart-ID app returns a login started in Safari to Chrome, the default browser', () => {
  test('tells the person in Chrome to log in there', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const callbackUrl = await smartIdApp.confirmAndReturn(await tapLogInToOpenTheSmartIdApp(page));

    const chromeTab = await openTheSmartIdCallbackIn(await anotherBrowser(CHROME), callbackUrl);

    await expectToldToLogInHere(chromeTab);
  });

  test('accepts the login Try again starts in Chrome when Smart-ID returns it there', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const chrome = await anotherBrowser(CHROME);
    const callbackUrl = await tryAgainWhereSmartIdReturnedTheLogin(page, chrome, smartIdApp);

    const { callbackAnswer } = await openTheSmartIdCallbackIn(chrome, callbackUrl);

    expect(callbackAnswer.status()).toBe(200);
  });

  test('logs the person in in Chrome after Try again', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const chrome = await anotherBrowser(CHROME);
    const callbackUrl = await tryAgainWhereSmartIdReturnedTheLogin(page, chrome, smartIdApp);

    const { tab, tokenAnswer } = await logInWithTheSmartIdCallbackIn(chrome, callbackUrl);
    expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt(tokenAnswer);

    await expectLoggedIn(tab);
  });

  test('brings the person back to the page they were sent to log in from after Try again in Chrome', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    test.fail(true, RELEASE_1_TRY_AGAIN_KEEPS_THE_PAGE_THE_LOGIN_STARTED_FROM);
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const chrome = await anotherBrowser(CHROME);
    const callbackUrl = await tryAgainWhereSmartIdReturnedTheLogin(page, chrome, smartIdApp);

    const { tab, tokenAnswer } = await logInWithTheSmartIdCallbackIn(chrome, callbackUrl);
    expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt(tokenAnswer);

    await expectLoggedInOn(tab, PAGE_A_NEWSLETTER_LINKS_TO);
  });
});
