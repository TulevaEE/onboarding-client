import XCTest

final class FacebookInAppBrowserTests: InAppBrowserTestCase {
  private static let openInTheBrowser = NSPredicate(
    format: "(elementType == %d OR elementType == %d) AND label == 'Ava brauseris'",
    XCUIElement.ElementType.link.rawValue, XCUIElement.ElementType.button.rawValue)

  func testOffersToOpenTheSameLoginAddressInSafari() throws {
    inAppLoginPage.chooseSmartId()
    evidence.screenshot("smart-id-tab-in-the-facebook-in-app-browser")
    let openInSafari = inAppBrowser.webViews.firstMatch.descendants(matching: .any)
      .matching(Self.openInTheBrowser).firstMatch

    XCTAssertTrue(openInSafari.waitForExistence(timeout: 5), "No \"Ava brauseris\" on the Smart-ID tab")
    XCTAssertFalse(inAppLoginPage.logIn.exists, "Sisenen is offered inside Facebook")
    openInSafari.tap()
    XCTAssertTrue(safari.isInTheForeground(within: 10), "Safari did not open")
    evidence.screenshot("safari-after-the-hand-off")
    XCTAssertEqual(addressIgnoringScheme(safari.address()), addressIgnoringScheme(loginAddressFromAnAd))
  }

  private func addressIgnoringScheme(_ url: URL?) -> String? {
    guard let url, var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      return nil
    }
    components.scheme = nil
    return components.string
  }
}
