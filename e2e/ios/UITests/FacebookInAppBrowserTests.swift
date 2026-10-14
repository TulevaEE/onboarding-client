import XCTest

final class FacebookInAppBrowserTests: SafariLoginTestCase {
  private static let openInTheBrowser = NSPredicate(
    format: "(elementType == %d OR elementType == %d) AND label == 'Ava brauseris'",
    XCUIElement.ElementType.link.rawValue, XCUIElement.ElementType.button.rawValue)

  private static let secondsAnotherAppWouldNeedToComeForward: UInt32 = 3

  private let inAppBrowser = XCUIApplication()
  private let loginAddressFromAnAd = E2EEnvironment.page("/login?utm_source=e2e")

  private var inAppAddress: URL? {
    URL(string: inAppBrowser.staticTexts["InAppBrowserAddress"].label)
  }

  private var inAppLoginPage: LoginPage { LoginPage(page: inAppBrowser.webViews.firstMatch) }

  private var addressesHandedToOtherApps: String {
    let handOffs = inAppBrowser.staticTexts["InAppBrowserHandOffs"]
    return handOffs.exists ? handOffs.label : ""
  }

  override func setUp() {
    super.setUp()
    safari.openNewTab(privately: false)
    inAppBrowser.launchEnvironment = [
      "IN_APP_BROWSER_START_URL": loginAddressFromAnAd.absoluteString,
      "IN_APP_BROWSER_USER_AGENT": UserAgents.facebookIos,
    ]
    inAppBrowser.launch()
    XCTAssertTrue(inAppLoginPage.waitUntilShownInsideAnApp(), "Login page did not load in the in-app browser")
  }

  override func tearDown() {
    inAppBrowser.terminate()
    super.tearDown()
  }

  func testContinuingHereLeavesThePersonOnSmartIdsCouldNotOpenTheAppPageInsideTheInAppBrowser() throws {
    evidence.screenshot("login-page-in-the-facebook-in-app-browser")

    inAppLoginPage.tapContinueHereToOpenTheSmartIdApp()
    let web2AppLink = try XCTUnwrap(waitForTheInAppAddress(Pages.isWeb2AppLink))
    sleep(Self.secondsAnotherAppWouldNeedToComeForward)
    evidence.screenshot("in-app-browser-shows-the-device-link-page")
    evidence.note(
      "in-app address: \(web2AppLink)\nhanded to other apps: \(addressesHandedToOtherApps)",
      named: "what-happened")

    XCTAssertEqual(inAppBrowser.state, .runningForeground)
    XCTAssertNotEqual(safari.app.state, .runningForeground)
    XCTAssertEqual(addressesHandedToOtherApps, "")
  }

  func testSmartIdAppReturningToSafariTellsThePersonToLogInThere() throws {
    inAppLoginPage.tapContinueHereToOpenTheSmartIdApp()
    let web2AppLink = try XCTUnwrap(waitForTheInAppAddress(Pages.isWeb2AppLink))

    let returned = try smartIdAppConfirmsAndReturnsToSafari(web2AppLink: web2AppLink, leaving: [])
    let outcome = loginResult.outcome()
    evidence.screenshot("callback-in-safari-without-the-in-app-session")

    XCTAssertFalse(returned.tab.isPrivate, "Callback opened in \(returned.tab)")
    XCTAssertEqual(try callbackErrorCode(of: returned), "auth.session.not.found")
    XCTAssertEqual(outcome, .sentToLogInInTheBrowserSmartIdOpened)
  }

  func testSmartIdAppReturningToASafariWithAnUnfinishedLoginOfItsOwnTellsThePersonToLogInThere() throws {
    let safariTab = try openTheLoginPage(privately: false)
    _ = try web2AppLinkOfTheLoginStartedBy { loginPage.tapLogInToOpenTheSmartIdApp() }
    evidence.screenshot("safari-left-with-an-unfinished-login")
    inAppBrowser.activate()
    XCTAssertTrue(inAppBrowser.wait(for: .runningForeground, timeout: 10), "In-app browser did not come back")
    inAppLoginPage.tapContinueHereToOpenTheSmartIdApp()
    let web2AppLink = try XCTUnwrap(waitForTheInAppAddress(Pages.isWeb2AppLink))

    let returned = try smartIdAppConfirmsAndReturnsToSafari(web2AppLink: web2AppLink, leaving: [safariTab])
    let outcome = loginResult.outcome()
    evidence.screenshot("callback-in-safari-that-has-its-own-unfinished-login")

    XCTAssertEqual(try callbackErrorCode(of: returned), "smart.id.callback.invalid")
    XCTAssertEqual(outcome, .sentToLogInInTheBrowserSmartIdOpened)
  }

  func testOffersToOpenTheSameLoginAddressInSafari() throws {
    inAppLoginPage.chooseSmartId()
    evidence.screenshot("smart-id-tab-in-the-facebook-in-app-browser")
    let openInSafari = inAppBrowser.webViews.firstMatch.descendants(matching: .any)
      .matching(Self.openInTheBrowser).firstMatch

    XCTAssertTrue(openInSafari.waitForExistence(timeout: 5), "No \"Ava brauseris\" on the Smart-ID tab")
    openInSafari.tap()
    XCTAssertTrue(safari.isInTheForeground(within: 10), "Safari did not open")
    evidence.screenshot("safari-after-the-hand-off")
    XCTAssertEqual(addressIgnoringScheme(safari.address()), addressIgnoringScheme(loginAddressFromAnAd))
  }

  private func waitForTheInAppAddress(_ condition: (URL?) -> Bool, timeout: TimeInterval = 30) -> URL? {
    let deadline = Date().addingTimeInterval(timeout)
    repeat {
      if condition(inAppAddress) {
        return inAppAddress
      }
      sleep(1)
    } while Date() < deadline
    return nil
  }

  private func addressIgnoringScheme(_ url: URL?) -> String? {
    guard let url, var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      return nil
    }
    components.scheme = nil
    return components.string
  }
}
