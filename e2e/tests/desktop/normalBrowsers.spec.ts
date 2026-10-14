import { test } from '../../support/test';
import { openTheSmartIdLoginFrom } from '../../support/loginPage';
import { expectNoWayOutOfTheBrowser } from '../../support/wayOutOfInAppBrowsers';
import { LINK_SHARED_IN_AN_APP } from '../../support/links';

test.describe('Smart-ID login in Chrome on a computer', () => {
  test('shows Chrome on a computer no control to open a link shared in an app in another browser', async ({
    page,
  }) => {
    const smartIdTab = await openTheSmartIdLoginFrom(page, LINK_SHARED_IN_AN_APP);

    await expectNoWayOutOfTheBrowser(page, smartIdTab);
  });
});
