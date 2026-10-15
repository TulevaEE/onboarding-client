import XCTest

struct SafariTab: Equatable, CustomStringConvertible {
  let id: String
  let isPrivate: Bool

  var description: String { "\(isPrivate ? "private" : "normal") tab \(id)" }
}

final class Safari {
  private static let tabDocument = NSPredicate(format: "identifier BEGINSWITH 'TabDocument?'")
  private static let leftToRightMark = "\u{200E}"
  private static let schemeSafariHidesInTheAddressBar = "http://"

  let app = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")

  var page: XCUIElement { app.webViews.firstMatch }

  private var tabsButton: XCUIElement { app.buttons["TabOverviewButton"] }
  private var collapsedAddress: XCUIElement { app.textFields["TabBarItemTitle"] }
  private var editedAddress: XCUIElement { app.textFields["URL"] }
  private var closeAddressEditing: XCUIElement { app.buttons["CancelBarItemButton"] }
  private var historyButton: XCUIElement { app.buttons["history"] }

  func isInTheForeground(within timeout: TimeInterval) -> Bool {
    app.wait(for: .runningForeground, timeout: timeout)
  }

  func restart() {
    app.terminate()
    app.launch()
    showBrowsingView()
  }

  func showBrowsingView() {
    if app.state != .runningForeground {
      app.activate()
    }
    dismissCoveringMenus()
    for _ in 0..<6 {
      if tabsButton.waitForExistence(timeout: 3) {
        return
      }
      if let wayBack = waysBackToTheBrowsingView.first(where: { $0.exists }) {
        wayBack.tap()
      } else {
        app.terminate()
        app.launch()
      }
    }
    XCTFail("Safari did not show a tab: \(app.debugDescription)")
  }

  private var coveringMenus: [XCUIElement] {
    [app.descendants(matching: .any)["HistoryMoreMenu"], app.descendants(matching: .any)["PopoverDismissRegion"]]
  }

  private func dismissCoveringMenus() {
    if coveringMenus.contains(where: { $0.exists }) {
      app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.6)).tap()
    }
  }

  private var waysBackToTheBrowsingView: [XCUIElement] {
    [
      app.buttons["DoneButton"],
      app.navigationBars["Clear History"].buttons["close"],
      app.descendants(matching: .any)["PopoverDismissRegion"],
      closeAddressEditing,
    ]
  }

  func clearHistoryAndWebsiteDataClosingAllTabs() {
    showBrowsingView()
    let allHistory = app.staticTexts["All history"]
    for _ in 0..<5 where !allHistory.waitForExistence(timeout: 2) {
      takeTheNextStepTowardsTheClearHistoryOptions()
    }
    tapWhenShown(allHistory, "All history")
    let closeAllTabs = app.switches["CloseAllTabsSwitch"]
    if closeAllTabs.waitForExistence(timeout: 5), closeAllTabs.value as? String == "0" {
      closeAllTabs.tap()
    }
    tapWhenShown(app.buttons["ClearHistoryButton"], "Clear History")
  }

  private func takeTheNextStepTowardsTheClearHistoryOptions() {
    let clearHistoryOptions = app.buttons["ShowClearHistoryOptionsButton"]
    let historyMenu = app.buttons["HistoryMoreMenuButton"]
    if clearHistoryOptions.exists {
      XCTAssertTrue(clearHistoryOptions.isEnabled, "Safari has no history to clear")
      clearHistoryOptions.tap()
    } else if historyMenu.exists {
      historyMenu.tap()
    } else if historyButton.exists {
      historyButton.tap()
    } else if collapsedAddress.exists {
      collapsedAddress.tap()
    }
  }

  private func tapWhenShown(_ element: XCUIElement, _ name: String) {
    guard element.waitForExistence(timeout: 10) else {
      XCTFail("Safari did not show \(name): \(app.debugDescription)")
      return
    }
    element.tap()
  }

  @discardableResult
  func openNewTab(privately: Bool) -> SafariTab? {
    let newTabMenuItem = privately ? "New Private Tab" : "New Tab"
    let newTab = app.buttons[newTabMenuItem]
    for attempt in 0..<3 {
      showBrowsingView()
      tabsButton.press(forDuration: 1.5)
      if newTab.waitForExistence(timeout: 5) {
        newTab.tap()
        return waitForTab { tab in tab.isPrivate == privately }
      }
      dismissCoveringMenus()
      if attempt == 1 {
        app.terminate()
        app.launch()
      }
    }
    XCTFail("Safari's tab menu has no \(newTabMenuItem): \(app.debugDescription)")
    return nil
  }

  func currentTab() -> SafariTab? {
    let documents = app.otherElements.matching(Self.tabDocument).allElementsBoundByIndex
    let shown = documents.first { $0.isHittable } ?? documents.first
    guard let identifier = shown?.identifier,
      let items = URLComponents(string: identifier)?.queryItems,
      let id = items.first(where: { $0.name == "UUID" })?.value
    else {
      return nil
    }
    return SafariTab(id: id, isPrivate: items.first(where: { $0.name == "IsPrivate" })?.value == "true")
  }

  func waitForTab(
    timeout: TimeInterval = 15, matching condition: (SafariTab) -> Bool
  ) -> SafariTab? {
    let deadline = Date().addingTimeInterval(timeout)
    repeat {
      if let tab = currentTab(), condition(tab) {
        return tab
      }
      sleep(1)
    } while Date() < deadline
    return nil
  }

  func address() -> URL? {
    guard collapsedAddress.waitForExistence(timeout: 10) else {
      return nil
    }
    collapsedAddress.tap()
    guard editedAddress.waitForExistence(timeout: 5) else {
      return nil
    }
    let address = (editedAddress.value as? String)?
      .replacingOccurrences(of: Self.leftToRightMark, with: "")
      .trimmingCharacters(in: .whitespaces)
    closeAddressEditing.tap()
    return address.map(withTheSchemeSafariHides).flatMap(URL.init(string:))
  }

  private func withTheSchemeSafariHides(_ address: String) -> String {
    address.contains("://") ? address : Self.schemeSafariHidesInTheAddressBar + address
  }

}
