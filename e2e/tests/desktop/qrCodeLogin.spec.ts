import { expect, test } from '../../support/test';
import { showTheSmartIdQrCodeOnTheComputer } from '../../support/loginPage';
import { expectLoggedInOn } from '../../support/loggedIn';
import { PAGE_A_NEWSLETTER_LINKS_TO } from '../../support/links';

test.describe('Smart-ID QR code on a computer', () => {
  test('logs the person in on the account page once the QR code is confirmed in the app', async ({
    page,
    smartIdApp,
  }) => {
    await page.goto('/login');

    await smartIdApp.confirm(await showTheSmartIdQrCodeOnTheComputer(page));

    await expectLoggedInOn(page, '/account');
  });

  test('brings the person back to the page they were sent to log in from', async ({
    page,
    smartIdApp,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    await expect(page).toHaveURL((url) => url.pathname === '/login');

    await smartIdApp.confirm(await showTheSmartIdQrCodeOnTheComputer(page));

    await expectLoggedInOn(page, PAGE_A_NEWSLETTER_LINKS_TO);
  });
});
