import { expect, test } from '../../support/test';
import {
  showTheSmartIdQrCodeOnThePhone,
  tapLogInToOpenTheSmartIdApp,
} from '../../support/loginPage';
import {
  logInWithTheSmartIdCallbackIn,
  openTheSmartIdCallbackIn,
} from '../../support/callbackPage';
import { expectLoggedInOn } from '../../support/loggedIn';
import { PAGE_A_NEWSLETTER_LINKS_TO } from '../../support/links';
import { expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt } from '../../support/expectedFailures';

test.describe('Smart-ID app returns to a new tab of the browser that started the login', () => {
  test('accepts the callback with the session cookie that started the login', async ({
    page,
    context,
    smartIdApp,
  }) => {
    await page.goto('/login');
    const callbackUrl = await smartIdApp.confirmAndReturn(await tapLogInToOpenTheSmartIdApp(page));
    await expect(page).toHaveURL((url) => url.pathname === '/login');

    const { callbackAnswer } = await openTheSmartIdCallbackIn(context, callbackUrl);

    expect(callbackAnswer.status()).toBe(200);
  });

  test('logs the person in on the account page', async ({ page, context, smartIdApp }) => {
    await page.goto('/login');
    const callbackUrl = await smartIdApp.confirmAndReturn(await tapLogInToOpenTheSmartIdApp(page));

    const { tab: returnedTab, tokenAnswer } = await logInWithTheSmartIdCallbackIn(
      context,
      callbackUrl,
    );
    expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt(tokenAnswer);

    await expectLoggedInOn(returnedTab, '/account');
  });

  test('sends the page the login started from through the callback Smart-ID opens', async ({
    page,
    smartIdApp,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    await expect(page).toHaveURL((url) => url.pathname === '/login');

    const callbackUrl = await smartIdApp.confirmAndReturn(await tapLogInToOpenTheSmartIdApp(page));

    expect(new URL(callbackUrl).searchParams.get('returnPath')).toBe(PAGE_A_NEWSLETTER_LINKS_TO);
  });

  test('brings the person back to the page they were sent to log in from', async ({
    page,
    context,
    smartIdApp,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    await expect(page).toHaveURL((url) => url.pathname === '/login');
    const callbackUrl = await smartIdApp.confirmAndReturn(await tapLogInToOpenTheSmartIdApp(page));

    const { tab: returnedTab, tokenAnswer } = await logInWithTheSmartIdCallbackIn(
      context,
      callbackUrl,
    );
    expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt(tokenAnswer);

    await expectLoggedInOn(returnedTab, PAGE_A_NEWSLETTER_LINKS_TO);
  });
});

test.describe('Smart-ID QR code on a phone', () => {
  test('brings the person back to the page they were sent to log in from', async ({
    page,
    smartIdApp,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    await expect(page).toHaveURL((url) => url.pathname === '/login');

    await smartIdApp.confirm(await showTheSmartIdQrCodeOnThePhone(page));

    await expectLoggedInOn(page, PAGE_A_NEWSLETTER_LINKS_TO);
  });
});
