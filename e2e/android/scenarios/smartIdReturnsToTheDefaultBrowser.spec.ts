import { expect, test } from '../support/test';
import { CHROME } from '../support/phone';
import {
  addressOf,
  expectLoggedInOn,
  tapLogInToOpenTheSmartIdApp,
} from '../support/loginOnThePhone';
import { expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt } from '../../support/expectedFailures';

test.describe
  .serial('Smart-ID app returns a login started in Chrome, the default browser, to a new Chrome tab', () => {
  let web2AppLink: string;
  let callbackOpened: number;

  test('Chrome opens the Smart-ID app link from the login page and offers no way out of Chrome', async ({
    phone,
    loginTraffic,
  }) => {
    expect(await phone.defaultBrowserFor(addressOf('/login'))).toBe(CHROME.packageName);

    ({ web2AppLink } = await tapLogInToOpenTheSmartIdApp(phone, loginTraffic, CHROME, '/login'));
  });

  test('Chrome sends the callback with the session cookie that started the login', async ({
    phone,
    loginTraffic,
    smartIdApp,
  }) => {
    const callbackUrl = await smartIdApp.confirmAndReturn(web2AppLink);

    callbackOpened = loginTraffic.mark();
    await phone.step('Smart-ID app opens the callback in the default browser', async () => {
      await phone.openLikeTheSmartIdApp(callbackUrl);
      expect((await loginTraffic.callbackAnswerSince(callbackOpened)).status).toBe(200);
      expect(await phone.foregroundApp()).toBe(CHROME.packageName);
    });
  });

  test('logs the person in on the account page', async ({ phone, loginTraffic }) => {
    const tokenAnswer = await phone.step('the callback tab redeems the login', () =>
      loginTraffic.finalTokenAnswerSince(callbackOpened),
    );
    expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt(tokenAnswer);

    await phone.step('logged in on /account', () => expectLoggedInOn(phone, '/account'));
  });
});
