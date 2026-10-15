import XCTest

class InAppBrowserTestCase: SafariLoginTestCase {
  let inAppBrowser = XCUIApplication()
  let loginAddressFromAnAd = E2EEnvironment.page("/login?utm_source=e2e")

  var inAppUserAgent: String { UserAgents.facebookIos }

  var inAppAddress: URL? {
    URL(string: inAppBrowser.staticTexts["InAppBrowserAddress"].label)
  }

  var inAppLoginPage: LoginPage { LoginPage(page: inAppBrowser.webViews.firstMatch) }

  var addressesHandedToOtherApps: String {
    let handOffs = inAppBrowser.staticTexts["InAppBrowserHandOffs"]
    return handOffs.exists ? handOffs.label : ""
  }

  override func setUp() {
    super.setUp()
    safari.openNewTab(privately: false)
    inAppBrowser.launchEnvironment = [
      "IN_APP_BROWSER_START_URL": loginAddressFromAnAd.absoluteString,
      "IN_APP_BROWSER_USER_AGENT": inAppUserAgent,
    ]
    inAppBrowser.launch()
    XCTAssertTrue(inAppLoginPage.waitUntilTheSmartIdTabIsShown(), "Login page did not load in the in-app browser")
  }

  override func tearDown() {
    inAppBrowser.terminate()
    super.tearDown()
  }

  func waitForTheInAppAddress(_ condition: (URL?) -> Bool, timeout: TimeInterval = 30) -> URL? {
    let deadline = Date().addingTimeInterval(timeout)
    repeat {
      if condition(inAppAddress) {
        return inAppAddress
      }
      sleep(1)
    } while Date() < deadline
    return nil
  }
}
