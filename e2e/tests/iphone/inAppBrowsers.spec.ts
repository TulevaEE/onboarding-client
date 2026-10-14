import { test } from '../../support/test';
import { openTheSmartIdLoginFrom, web2AppLinkOpenedBy } from '../../support/loginPage';
import {
  CONTINUE_HERE,
  continueHereOf,
  expectRenderedWithTheLoginTab,
  expectToBeOfferedTheWayOut,
  instagramExternalBrowserLinkTo,
  safariLinkTo,
  safariWindowOpenTo,
} from '../../support/wayOutOfInAppBrowsers';
import { LINK_SHARED_IN_AN_APP } from '../../support/links';
import { userAgents } from '../../support/userAgents';

[
  {
    app: 'Facebook',
    userAgent: userAgents.facebookIos,
    wayOut: safariWindowOpenTo(LINK_SHARED_IN_AN_APP),
  },
  {
    app: 'Messenger',
    userAgent: userAgents.messengerIos,
    wayOut: safariLinkTo(LINK_SHARED_IN_AN_APP),
  },
  {
    app: 'Instagram',
    userAgent: userAgents.instagramIos,
    wayOut: instagramExternalBrowserLinkTo(LINK_SHARED_IN_AN_APP),
  },
  {
    app: 'Threads',
    userAgent: userAgents.threadsIos,
    wayOut: safariWindowOpenTo(LINK_SHARED_IN_AN_APP),
  },
  {
    app: 'the Google app',
    userAgent: userAgents.googleAppIos,
    wayOut: safariLinkTo(LINK_SHARED_IN_AN_APP),
  },
].forEach(({ app, userAgent, wayOut }) => {
  test.describe(`Smart-ID login inside ${app} on the iPhone`, () => {
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
