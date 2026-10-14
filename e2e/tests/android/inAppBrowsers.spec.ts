import { test } from '../../support/test';
import { openTheSmartIdLoginFrom, web2AppLinkOpenedBy } from '../../support/loginPage';
import {
  CONTINUE_HERE,
  androidIntentLinkTo,
  continueHereOf,
  expectRenderedWithTheLoginTab,
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

    test(`still opens the Smart-ID app inside ${app} when the person taps ${CONTINUE_HERE}`, async ({
      page,
    }) => {
      const smartIdTab = await openTheSmartIdLoginFrom(page, LINK_SHARED_IN_AN_APP);
      const continueHere = continueHereOf(smartIdTab);
      await expectRenderedWithTheLoginTab(continueHere).toBeVisible();

      await web2AppLinkOpenedBy(page, () => continueHere.click());
    });
  });
});
