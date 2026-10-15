import XCTest

final class SafariPrivateTabTests: SafariLoginTestCase {
  func testTheLoginPageInAPrivateTabWarnsBeforeThePinAndStillOffersLogIn() throws {
    _ = try openTheLoginPage(privately: true)
    loginPage.chooseSmartId()

    XCTAssertTrue(loginPage.privateTabWarning.waitForExistence(timeout: 10), "No private tab warning")
    evidence.screenshot("login-page-in-a-private-tab-warns")
    XCTAssertTrue(loginPage.logIn.exists)
  }

  func testSmartIdAppReturnsToANewPrivateTabWhichTellsThePersonToOpenANormalTab() throws {
    let startingTab = try openTheLoginPage(privately: true)

    let web2AppLink = try web2AppLinkOfTheLoginStartedBy { loginPage.tapLogInToOpenTheSmartIdApp() }
    let returned = try smartIdAppConfirmsAndReturnsToSafari(web2AppLink: web2AppLink, leaving: [startingTab])
    let outcome = loginResult.outcome()
    evidence.screenshot("callback-in-another-private-tab")

    XCTAssertTrue(returned.tab.isPrivate, "Callback opened in \(returned.tab)")
    XCTAssertEqual(try callbackErrorCode(of: returned), "auth.session.not.found")
    XCTAssertEqual(outcome, .toldToOpenANormalTab)
    XCTAssertFalse(loginResult.tryAgain.exists, "Proovi uuesti would fail the same way in a private tab")
  }
}
