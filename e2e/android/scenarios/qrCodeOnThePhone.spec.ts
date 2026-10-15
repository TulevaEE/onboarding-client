import { test } from '../support/test';
import { logInWithTheQrCodeInChrome } from '../support/loginOnThePhone';
import { PAGE_A_NEWSLETTER_LINKS_TO } from '../../support/links';

test.describe('Smart-ID QR code shown in Chrome on the phone', () => {
  test('logs the person in and brings them back to the page they were sent to log in from', async ({
    phone,
    loginTraffic,
    smartIdApp,
  }) => {
    await logInWithTheQrCodeInChrome(phone, loginTraffic, smartIdApp, PAGE_A_NEWSLETTER_LINKS_TO);
  });
});
