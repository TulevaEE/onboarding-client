import { expect, test } from '../support/test';
import { CHROME, Phone, SAMSUNG_INTERNET } from '../support/phone';
import { LoginExchange, LoginTraffic } from '../support/loginTraffic';
import {
  TOLD_TO_LOG_IN_IN_THE_BROWSER_SMART_ID_OPENED,
  TRY_AGAIN,
  addressOf,
  expectLoggedIn,
  expectLoggedInOn,
  expectTheBrowserToShowTheSmartIdAppLink,
  logInWithTheQrCodeInChrome,
  tapLogInToOpenTheSmartIdApp,
} from '../support/loginOnThePhone';
import {
  ANOTHER_LOGIN_OF_THIS_BROWSER_REJECTS_THE_CALLBACK,
  ONLY_A_MISSING_SESSION_IS_TOLD_TO_LOG_IN_HERE,
} from '../support/expectedFailures';
import {
  RELEASE_1_TRY_AGAIN_KEEPS_THE_PAGE_THE_LOGIN_STARTED_FROM,
  expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt,
} from '../../support/expectedFailures';
import { PAGE_A_NEWSLETTER_LINKS_TO } from '../../support/links';
import { SmartIdApp } from '../../support/smartIdApp';

const SESSION_THE_LOGIN_STARTED_IN_IS_MISSING = 'auth.session.not.found';
const SAMSUNG_INTERNET_USER_AGENT_TOKEN = 'SamsungBrowser/';

async function startTheLoginInSamsungInternet(
  phone: Phone,
  loginTraffic: LoginTraffic,
): Promise<string> {
  expect(await phone.defaultBrowserFor(addressOf('/login'))).toBe(CHROME.packageName);
  const start = await tapLogInToOpenTheSmartIdApp(
    phone,
    loginTraffic,
    SAMSUNG_INTERNET,
    PAGE_A_NEWSLETTER_LINKS_TO,
  );
  expect(start.userAgent).toContain(SAMSUNG_INTERNET_USER_AGENT_TOKEN);
  return start.web2AppLink;
}

async function returnTheLoginToTheDefaultBrowser(
  phone: Phone,
  loginTraffic: LoginTraffic,
  smartIdApp: SmartIdApp,
  web2AppLink: string,
): Promise<LoginExchange> {
  const callbackUrl = await smartIdApp.confirmAndReturn(web2AppLink);
  const callbackOpened = loginTraffic.mark();
  return phone.step('Smart-ID app opens the callback in the default browser', async () => {
    await phone.openLikeTheSmartIdApp(callbackUrl);
    const callbackAnswer = await loginTraffic.callbackAnswerSince(callbackOpened);
    await phone.waitFor(TRY_AGAIN);
    expect(await phone.foregroundApp()).toBe(CHROME.packageName);
    return callbackAnswer;
  });
}

async function expectToldToLogInHere(phone: Phone): Promise<void> {
  expect(await phone.isShown(TOLD_TO_LOG_IN_IN_THE_BROWSER_SMART_ID_OPENED)).toBe(true);
}

test.describe
  .serial('Smart-ID app returns a login started in Samsung Internet to Chrome, the default browser, which holds no login of its own', () => {
  let web2AppLink: string;
  let callbackOpenedAfterTryAgain: number;

  test(`Chrome finishes its own login and Samsung Internet opens the Smart-ID app link from ${PAGE_A_NEWSLETTER_LINKS_TO}, offering no way out of Samsung Internet`, async ({
    phone,
    loginTraffic,
    smartIdApp,
  }) => {
    await logInWithTheQrCodeInChrome(phone, loginTraffic, smartIdApp, '/account');

    web2AppLink = await startTheLoginInSamsungInternet(phone, loginTraffic);
  });

  test('tells the person in Chrome to log in there', async ({
    phone,
    loginTraffic,
    smartIdApp,
  }) => {
    const callbackAnswer = await returnTheLoginToTheDefaultBrowser(
      phone,
      loginTraffic,
      smartIdApp,
      web2AppLink,
    );

    expect(callbackAnswer.errorCode).toBe(SESSION_THE_LOGIN_STARTED_IN_IS_MISSING);
    await expectToldToLogInHere(phone);
  });

  test(`logs the person in in Chrome after ${TRY_AGAIN}`, async ({
    phone,
    loginTraffic,
    smartIdApp,
  }) => {
    const triedAgain = loginTraffic.mark();
    const linkOfTheNewLogin = await phone.step(`tap ${TRY_AGAIN} in Chrome`, async () => {
      await phone.tap(TRY_AGAIN);
      const start = await loginTraffic.web2AppLinkSince(triedAgain);
      await expectTheBrowserToShowTheSmartIdAppLink(phone, start.web2AppLink);
      return start.web2AppLink;
    });
    const callbackUrl = await smartIdApp.confirmAndReturn(linkOfTheNewLogin);

    callbackOpenedAfterTryAgain = loginTraffic.mark();
    await phone.step('Smart-ID app opens the callback in the default browser', async () => {
      await phone.openLikeTheSmartIdApp(callbackUrl);
      expect((await loginTraffic.callbackAnswerSince(callbackOpenedAfterTryAgain)).status).toBe(
        200,
      );
    });
    const tokenAnswer = await phone.step('the callback tab redeems the login', () =>
      loginTraffic.finalTokenAnswerSince(callbackOpenedAfterTryAgain),
    );
    expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt(tokenAnswer);

    await phone.step('logged in', () => expectLoggedIn(phone));
  });

  test(`brings the person back to ${PAGE_A_NEWSLETTER_LINKS_TO} after ${TRY_AGAIN} in Chrome`, async ({
    phone,
    loginTraffic,
  }) => {
    test.fail(true, RELEASE_1_TRY_AGAIN_KEEPS_THE_PAGE_THE_LOGIN_STARTED_FROM);
    expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt(
      await loginTraffic.finalTokenAnswerSince(callbackOpenedAfterTryAgain),
    );

    await phone.step(`logged in on ${PAGE_A_NEWSLETTER_LINKS_TO}`, () =>
      expectLoggedInOn(phone, PAGE_A_NEWSLETTER_LINKS_TO),
    );
  });
});

test.describe
  .serial('Smart-ID app returns a login started in Samsung Internet to Chrome, the default browser, which holds an unfinished login of its own', () => {
  let web2AppLink: string;

  test(`Chrome leaves a login unfinished and Samsung Internet opens the Smart-ID app link from ${PAGE_A_NEWSLETTER_LINKS_TO}`, async ({
    phone,
    loginTraffic,
  }) => {
    await tapLogInToOpenTheSmartIdApp(phone, loginTraffic, CHROME, '/login');

    web2AppLink = await startTheLoginInSamsungInternet(phone, loginTraffic);
  });

  test('tells the person in Chrome to log in there', async ({
    phone,
    loginTraffic,
    smartIdApp,
  }) => {
    const callbackAnswer = await returnTheLoginToTheDefaultBrowser(
      phone,
      loginTraffic,
      smartIdApp,
      web2AppLink,
    );
    test.fail(
      callbackAnswer.errorCode === ANOTHER_LOGIN_OF_THIS_BROWSER_REJECTS_THE_CALLBACK,
      ONLY_A_MISSING_SESSION_IS_TOLD_TO_LOG_IN_HERE,
    );

    await expectToldToLogInHere(phone);
  });
});
