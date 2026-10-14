import { test } from '../../support/test';
import {
  expectToldToLogInHere,
  openTheSmartIdCallbackIn,
  tryAgainWhereSmartIdReturnedTheLogin,
} from '../../support/callbackPage';
import { PAGE_A_NEWSLETTER_LINKS_TO } from '../../support/links';

test.describe('Smart-ID app returns a login started in Safari to a new private tab every time', () => {
  test('tells the person again when the login Try again starts in a private tab returns to yet another private tab', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const callbackUrl = await tryAgainWhereSmartIdReturnedTheLogin(
      page,
      await anotherBrowser(),
      smartIdApp,
    );

    const yetAnotherPrivateTab = await openTheSmartIdCallbackIn(
      await anotherBrowser(),
      callbackUrl,
    );

    await expectToldToLogInHere(yetAnotherPrivateTab);
  });
});
