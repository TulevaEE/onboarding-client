import { test } from '../../support/test';
import { tapLogInToOpenTheSmartIdApp } from '../../support/loginPage';
import { expectToldToLogInHere, openTheSmartIdCallbackIn } from '../../support/callbackPage';
import { PAGE_A_NEWSLETTER_LINKS_TO } from '../../support/links';

const ANOTHER_LOGIN_OF_THIS_BROWSER_REJECTS_THE_CALLBACK = 'smart.id.callback.invalid';

test.describe('Smart-ID app returns a login to a browser that holds an unfinished login of its own', () => {
  test('tells the person in that browser to log in there', async ({
    page,
    smartIdApp,
    anotherBrowser,
  }) => {
    const defaultBrowser = await anotherBrowser();
    const abandonedTab = await defaultBrowser.newPage();
    await abandonedTab.goto('/login');
    await tapLogInToOpenTheSmartIdApp(abandonedTab);
    await page.goto(PAGE_A_NEWSLETTER_LINKS_TO);
    const callbackUrl = await smartIdApp.confirmAndReturn(await tapLogInToOpenTheSmartIdApp(page));

    const returned = await openTheSmartIdCallbackIn(defaultBrowser, callbackUrl);

    await expectToldToLogInHere(returned, ANOTHER_LOGIN_OF_THIS_BROWSER_REJECTS_THE_CALLBACK);
  });
});
