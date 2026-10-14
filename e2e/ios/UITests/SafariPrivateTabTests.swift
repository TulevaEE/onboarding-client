import XCTest

final class SafariPrivateTabTests: SafariLoginTestCase {
  func testSmartIdAppReturnsToANewPrivateTabWhichTellsThePersonToLogInThere() throws {
    let startingTab = try openTheLoginPage(privately: true)
    evidence.screenshot("login-page-in-a-private-tab")

    let web2AppLink = try web2AppLinkOfTheLoginStartedBy { loginPage.tapLogInToOpenTheSmartIdApp() }
    let returned = try smartIdAppConfirmsAndReturnsToSafari(web2AppLink: web2AppLink, leaving: [startingTab])
    let outcome = loginResult.outcome()
    evidence.screenshot("callback-in-another-private-tab")

    XCTAssertTrue(returned.tab.isPrivate, "Callback opened in \(returned.tab)")
    XCTAssertEqual(try callbackErrorCode(of: returned), "auth.session.not.found")
    XCTAssertEqual(outcome, .sentToLogInInTheBrowserSmartIdOpened)
    XCTAssertTrue(loginResult.tryAgain.exists)
  }

  func testTryAgainInThePrivateTabSmartIdOpenedLoopsIntoYetAnotherPrivateTab() throws {
    let startingTab = try openTheLoginPage(privately: true)
    let firstLink = try web2AppLinkOfTheLoginStartedBy { loginPage.tapLogInToOpenTheSmartIdApp() }
    let first = try smartIdAppConfirmsAndReturnsToSafari(web2AppLink: firstLink, leaving: [startingTab])
    XCTAssertEqual(loginResult.outcome(), .sentToLogInInTheBrowserSmartIdOpened)
    evidence.screenshot("first-callback-asks-to-try-again")

    let secondLink = try web2AppLinkOfTheLoginStartedBy { loginResult.tryAgain.tap() }
    let second = try smartIdAppConfirmsAndReturnsToSafari(
      web2AppLink: secondLink, leaving: [startingTab, first.tab])
    let secondOutcome = loginResult.outcome()
    evidence.screenshot("second-callback-in-yet-another-private-tab")

    XCTAssertTrue(first.tab.isPrivate, "First callback opened in \(first.tab)")
    XCTAssertTrue(second.tab.isPrivate, "Second callback opened in \(second.tab)")
    XCTAssertEqual(try callbackErrorCode(of: second), "auth.session.not.found")
    XCTAssertEqual(secondOutcome, .sentToLogInInTheBrowserSmartIdOpened)
  }
}
