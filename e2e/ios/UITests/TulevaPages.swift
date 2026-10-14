import CoreImage
import XCTest

enum LoginOutcome: Equatable {
  case loggedIn
  case sentToLogInInTheBrowserSmartIdOpened
  case failedWithTheGenericLoginError
  case otherError(String)
}

struct LoginPage {
  private static let qrCodeImage = NSPredicate(format: "label BEGINSWITH 'Skänni Smart'")

  let page: XCUIElement

  var smartIdTab: XCUIElement { page.buttons["Smart-ID"].firstMatch }
  var logIn: XCUIElement { page.buttons["Sisenen"].firstMatch }
  var showQrCode: XCUIElement { page.buttons["Näita QR-koodi"].firstMatch }
  var qrCode: XCUIElement { page.images.matching(Self.qrCodeImage).firstMatch }

  func waitUntilShown(timeout: TimeInterval = 60) -> Bool {
    logIn.waitForExistence(timeout: timeout)
  }

  func waitUntilTheSmartIdTabIsShown(timeout: TimeInterval = 60) -> Bool {
    smartIdTab.waitForExistence(timeout: timeout)
  }

  func chooseSmartId() {
    if smartIdTab.exists && !smartIdTab.isSelected {
      smartIdTab.tap()
    }
  }

  func tapLogInToOpenTheSmartIdApp() {
    chooseSmartId()
    XCTAssertTrue(Self.waitUntilHittable(logIn), "Sisenen cannot be tapped")
    logIn.tap()
  }

  private static func waitUntilHittable(_ element: XCUIElement, timeout: TimeInterval = 10) -> Bool {
    let hittable = XCTNSPredicateExpectation(predicate: NSPredicate(format: "isHittable == true"), object: element)
    return XCTWaiter().wait(for: [hittable], timeout: timeout) == .completed
  }

  func showTheQrCodeOnThePhone() {
    chooseSmartId()
    showQrCode.tap()
  }

  func linkInTheShownQrCode(timeout: TimeInterval = 30) -> URL? {
    guard qrCode.waitForExistence(timeout: timeout) else {
      return nil
    }
    let deadline = Date().addingTimeInterval(timeout)
    repeat {
      if let link = Self.decodeQrCode(in: qrCode.screenshot().image) {
        return link
      }
      sleep(1)
    } while Date() < deadline
    return nil
  }

  private static func decodeQrCode(in image: UIImage) -> URL? {
    guard let picture = CIImage(image: image),
      let detector = CIDetector(
        ofType: CIDetectorTypeQRCode, context: nil, options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])
    else {
      return nil
    }
    return detector.features(in: picture)
      .compactMap { ($0 as? CIQRCodeFeature)?.messageString }
      .compactMap(URL.init(string:))
      .first
  }
}

struct LoginResultPage {
  private static let theAnotherBrowserMessage = "teises brauseris või aknas"
  private static let theGenericLoginError = "Sisselogimisel tekkis viga. Palun proovi uuesti."
  private static let titleOfTheAccountPage = "Minu konto – Tuleva"

  let page: XCUIElement

  var tryAgain: XCUIElement { page.links["Proovi uuesti"].firstMatch }
  var skipToContent: XCUIElement { page.links["Liigu edasi sisu juurde"].firstMatch }
  var errorAlert: XCUIElement { page.otherElements["alert"].firstMatch }

  func showsTheAccountPage(timeout: TimeInterval = 30) -> Bool {
    page.otherElements[Self.titleOfTheAccountPage].firstMatch.waitForExistence(timeout: timeout)
  }

  func outcome(timeout: TimeInterval = 60) -> LoginOutcome? {
    let deadline = Date().addingTimeInterval(timeout)
    repeat {
      if skipToContent.exists {
        return .loggedIn
      }
      if tryAgain.exists {
        return outcomeOfTheShownError()
      }
      sleep(1)
    } while Date() < deadline
    return nil
  }

  private func outcomeOfTheShownError() -> LoginOutcome {
    guard let message = shownErrorMessage() else {
      return .otherError("No error message next to Proovi uuesti: \(page.debugDescription)")
    }
    if message.contains(Self.theAnotherBrowserMessage) {
      return .sentToLogInInTheBrowserSmartIdOpened
    }
    if message == Self.theGenericLoginError {
      return .failedWithTheGenericLoginError
    }
    return .otherError(message)
  }

  private func shownErrorMessage(timeout: TimeInterval = 5) -> String? {
    let deadline = Date().addingTimeInterval(timeout)
    repeat {
      let message = errorAlert.staticTexts.allElementsBoundByIndex.map(\.label).joined(separator: " ")
      if !message.isEmpty {
        return message
      }
      sleep(1)
    } while Date() < deadline
    return nil
  }
}

enum Pages {
  static func isWeb2AppLink(_ url: URL?) -> Bool {
    guard let url, let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems else {
      return false
    }
    return items.contains { $0.name == "deviceLinkType" && $0.value == "Web2App" }
      && items.contains { $0.name == "sessionToken" }
  }
}
