import { test } from '../../support/test';
import { openTheSmartIdLoginFrom } from '../../support/loginPage';
import { expectNoWayOutOfTheBrowser } from '../../support/wayOutOfInAppBrowsers';
import { LINK_SHARED_IN_AN_APP } from '../../support/links';
import { userAgents } from '../../support/userAgents';

[
  { browser: 'Chrome on Android', userAgent: userAgents.androidChrome },
  { browser: 'Samsung Internet', userAgent: userAgents.samsungInternet },
].forEach(({ browser, userAgent }) => {
  test.describe(`Smart-ID login in ${browser}`, () => {
    test.use({ userAgent });

    test(`shows ${browser} no control to open a link shared in an app in another browser`, async ({
      page,
    }) => {
      const smartIdTab = await openTheSmartIdLoginFrom(page, LINK_SHARED_IN_AN_APP);

      await expectNoWayOutOfTheBrowser(page, smartIdTab);
    });
  });
});
