import XCTest

final class SafariNormalTabTests: SafariLoginTestCase {
  func testSmartIdAppReturnsToANewNormalTabWhichLogsThePersonInOnTheAccountPage() throws {
    let startingTab = try openTheLoginPage(privately: false)
    evidence.screenshot("login-page")

    let web2AppLink = try web2AppLinkOfTheLoginStartedBy { loginPage.tapLogInToOpenTheSmartIdApp() }
    evidence.screenshot("smart-id-app-not-installed-so-safari-shows-the-device-link")

    let returned = try smartIdAppConfirmsAndReturnsToSafari(web2AppLink: web2AppLink, leaving: [startingTab])
    let outcome = loginResult.outcome()
    evidence.screenshot("callback-in-a-new-normal-tab")

    XCTAssertFalse(returned.tab.isPrivate, "Callback opened in \(returned.tab)")
    XCTAssertEqual(try loginTraffic.callbackAnswer(since: returned.trafficBeforeTheCallback).status, 200)
    ExpectedFailures.expectLoggedInUnlessTheMockServiceRejectsIt(
      try loginTraffic.finalTokenAnswer(since: returned.trafficBeforeTheCallback))
    XCTAssertEqual(outcome, .loggedIn)
    XCTAssertTrue(loginResult.showsTheAccountPage())
  }

  func testTheLoginPageInANormalTabSaysNothingAboutPrivateTabs() throws {
    _ = try openTheLoginPage(privately: false)
    loginPage.chooseSmartId()

    XCTAssertFalse(loginPage.privateTabWarning.waitForExistence(timeout: 5), "Private tab warning in a normal tab")
  }

  func testQrCodeShownOnThePhoneLogsThePersonInOnTheAccountPage() throws {
    _ = try openTheLoginPage(privately: false)

    loginPage.showTheQrCodeOnThePhone()
    let qrCodeLink = try XCTUnwrap(loginPage.linkInTheShownQrCode(), "No readable QR code on the page")
    evidence.screenshot("qr-code")
    try smartIdApp.confirm(deviceLink: qrCodeLink)

    let outcome = loginResult.outcome()
    evidence.screenshot("logged-in")
    XCTAssertEqual(outcome, .loggedIn)
    XCTAssertTrue(loginResult.showsTheAccountPage())
  }
}
