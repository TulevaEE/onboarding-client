import XCTest

struct ReturnToSafari {
  let tab: SafariTab
  let trafficBeforeTheCallback: Int
}

class SafariLoginTestCase: XCTestCase {
  let safari = Safari()
  let smartIdApp = SmartIdApp()
  let loginTraffic = LoginTraffic()
  lazy var evidence = Evidence(of: self)

  var loginPage: LoginPage { LoginPage(page: safari.page) }
  var loginResult: LoginResultPage { LoginResultPage(page: safari.page) }

  override func setUp() {
    super.setUp()
    continueAfterFailure = false
    startWithSafariClearedOfEarlierScenarios()
  }

  override func tearDown() {
    safari.openNewTab(privately: false)
    super.tearDown()
  }

  private func startWithSafariClearedOfEarlierScenarios() {
    safari.restart()
    safari.openNewTab(privately: false)
    XCUIDevice.shared.system.open(E2EEnvironment.page("/login"))
    XCTAssertTrue(loginPage.waitUntilShown(), "Login page did not load in Safari")
    safari.clearHistoryAndWebsiteDataClosingAllTabs()
    safari.restart()
  }

  func openTheLoginPage(privately: Bool) throws -> SafariTab {
    XCTAssertNotNil(safari.openNewTab(privately: privately))
    XCUIDevice.shared.system.open(E2EEnvironment.page("/login"))
    XCTAssertTrue(loginPage.waitUntilShown(), "Login page did not load in Safari")
    return try XCTUnwrap(safari.currentTab(), "Safari shows no tab")
  }

  func web2AppLinkOfTheLoginStartedBy(_ startTheLogin: () -> Void) throws -> URL {
    let beforeTheLogin = try loginTraffic.mark()
    startTheLogin()
    return try loginTraffic.web2AppLink(since: beforeTheLogin)
  }

  func smartIdAppConfirmsAndReturnsToSafari(web2AppLink: URL, leaving tabs: [SafariTab]) throws -> ReturnToSafari {
    let callbackUrl = try smartIdApp.confirmAndReturn(web2AppLink: web2AppLink)
    let beforeTheCallback = try loginTraffic.mark()
    XCUIDevice.shared.system.open(callbackUrl)
    XCTAssertTrue(safari.isInTheForeground(within: 10), "Safari did not open the callback")
    let tab = try XCTUnwrap(safari.waitForTab { !tabs.contains($0) }, "Safari did not open the callback in a new tab")
    return ReturnToSafari(tab: tab, trafficBeforeTheCallback: beforeTheCallback)
  }

  func callbackErrorCode(of returned: ReturnToSafari) throws -> String? {
    try loginTraffic.callbackAnswer(since: returned.trafficBeforeTheCallback).errorCode
  }
}
