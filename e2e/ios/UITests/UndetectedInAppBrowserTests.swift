import XCTest

final class UndetectedInAppBrowserTests: InAppBrowserTestCase {
  override var inAppUserAgent: String { UserAgents.anAppWeDoNotDetect }

  func testSmartIdAppReturningToSafariTellsThePersonToLogInThere() throws {
    inAppLoginPage.tapLogInToOpenTheSmartIdApp()
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
    inAppLoginPage.tapLogInToOpenTheSmartIdApp()
    let web2AppLink = try XCTUnwrap(waitForTheInAppAddress(Pages.isWeb2AppLink))

    let returned = try smartIdAppConfirmsAndReturnsToSafari(web2AppLink: web2AppLink, leaving: [safariTab])
    let outcome = loginResult.outcome()
    evidence.screenshot("callback-in-safari-that-has-its-own-unfinished-login")

    XCTAssertEqual(try callbackErrorCode(of: returned), "smart.id.callback.invalid")
    XCTAssertEqual(outcome, .sentToLogInInTheBrowserSmartIdOpened)
  }
}
