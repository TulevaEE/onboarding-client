import { test } from '../../support/test';
import { openTheSmartIdLoginFrom } from '../../support/loginPage';
import {
  androidIntentLinkTo,
  expectNoSmartIdLoginInsideTheApp,
  expectToBeOfferedTheWayOut,
} from '../../support/wayOutOfInAppBrowsers';
import { LINK_SHARED_IN_AN_APP } from '../../support/links';
import { userAgents } from '../../support/userAgents';

const wayOut = androidIntentLinkTo(LINK_SHARED_IN_AN_APP);

[
  { app: 'Facebook', userAgent: userAgents.facebookAndroid },
  { app: 'Messenger', userAgent: userAgents.messengerAndroid },
  { app: 'TikTok', userAgent: userAgents.tikTokAndroid },
].forEach(({ app, userAgent }) => {
  test.describe(`Smart-ID login inside ${app} on Android`, () => {
    test.use({ userAgent });

    test(`offers to open ${LINK_SHARED_IN_AN_APP} ${wayOut.description}`, async ({ page }) => {
      const smartIdTab = await openTheSmartIdLoginFrom(page, LINK_SHARED_IN_AN_APP);

      await expectToBeOfferedTheWayOut(page, smartIdTab, wayOut);
    });

    test(`offers no Smart-ID login inside ${app}, where it cannot finish`, async ({ page }) => {
      const smartIdTab = await openTheSmartIdLoginFrom(page, LINK_SHARED_IN_AN_APP);

      await expectNoSmartIdLoginInsideTheApp(smartIdTab);
    });
  });
});
