import { expect, test } from '../support/test';
import { androidEnvironment } from '../support/androidEnvironment';
import { CHROME, MESSENGER_IN_APP_BROWSER, withoutScheme } from '../support/phone';
import { addressOf } from '../support/loginOnThePhone';
import { OPEN_IN_THE_BROWSER } from '../../support/wayOutOfInAppBrowsers';
import { LINK_SHARED_IN_AN_APP } from '../../support/links';

const MESSENGER_ASKS_BEFORE_LEAVING_THE_APP = 'CONTINUE';
const RENDERED_WITH_THE_LOGIN_TAB_MILLIS = 5000;
const POLL_INTERVAL_MILLIS = 1000;
const TIME_TO_LOOK_AROUND_AFTER_THE_LINK_OPENS_MILLIS = 60000;

test.describe.serial("Smart-ID login in Messenger's in-app browser, opened by the person", () => {
  test.skip(
    !androidEnvironment.attended,
    'Attended: set E2E_ANDROID_ATTENDED=true and open the link from a Messenger chat yourself (e2e/android/README.md)',
  );

  test(`Messenger's in-app browser shows the login for ${LINK_SHARED_IN_AN_APP}`, async ({
    phone,
  }) => {
    test.setTimeout(
      androidEnvironment.attendedWaitMillis + TIME_TO_LOOK_AROUND_AFTER_THE_LINK_OPENS_MILLIS,
    );

    await test.step(`the person opens ${addressOf(LINK_SHARED_IN_AN_APP)} in Messenger`, () =>
      expect
        .poll(phone.foregroundActivity, {
          timeout: androidEnvironment.attendedWaitMillis,
          intervals: [POLL_INTERVAL_MILLIS],
        })
        .toBe(MESSENGER_IN_APP_BROWSER));
    await phone.step("the login page in Messenger's in-app browser", () =>
      phone.waitFor(OPEN_IN_THE_BROWSER),
    );
  });

  test(`offers to open ${LINK_SHARED_IN_AN_APP} in the default browser`, async ({ phone }) => {
    await phone.step(`tap ${OPEN_IN_THE_BROWSER}`, async () => {
      await phone.waitFor(OPEN_IN_THE_BROWSER, RENDERED_WITH_THE_LOGIN_TAB_MILLIS);
      await phone.tap(OPEN_IN_THE_BROWSER);
    });
    await phone.step(`tap ${MESSENGER_ASKS_BEFORE_LEAVING_THE_APP} in Messenger`, async () => {
      await phone.tap(MESSENGER_ASKS_BEFORE_LEAVING_THE_APP);
      await expect.poll(phone.foregroundApp).toBe(CHROME.packageName);
      expect(await phone.addressInTheBar()).toBe(withoutScheme(addressOf(LINK_SHARED_IN_AN_APP)));
    });
  });
});
