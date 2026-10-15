import { test } from '../../support/test';
import {
  expectToldToOpenANormalSafariTab,
  expectWarnedBeforeThePinThatSmartIdCannotFinishInAPrivateTab,
  openTheSmartIdCallbackIn,
} from '../../support/callbackPage';
import { chooseSmartId, tapLogInToOpenTheSmartIdApp } from '../../support/loginPage';
import { PAGE_A_NEWSLETTER_LINKS_TO } from '../../support/links';

test.describe('A login started in a private Safari tab, which Smart-ID returns to a new private tab', () => {
  test.use({ privateSafariTabs: true });

  test('warns before the PIN that Smart-ID cannot finish in a private tab, and still offers Sisenen', async ({
    page,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    await chooseSmartId(page);

    await expectWarnedBeforeThePinThatSmartIdCannotFinishInAPrivateTab(page);
  });

  test('tells the person in the private tab Smart-ID opened to open a normal tab, with no Try again that would fail the same way', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const callbackUrl = await smartIdApp.confirmAndReturn(await tapLogInToOpenTheSmartIdApp(page));

    const anotherPrivateTab = await openTheSmartIdCallbackIn(await anotherBrowser(), callbackUrl);

    await expectToldToOpenANormalSafariTab(anotherPrivateTab);
  });
});
