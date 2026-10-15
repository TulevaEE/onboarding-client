import Foundation

enum E2EEnvironment {
  private static let variables = ProcessInfo.processInfo.environment

  static let siteUrl = url(named: "E2E_IOS_SITE_URL", fallback: "http://localhost:3290")
  static let smartIdMockUrl = url(named: "SMART_ID_MOCK_URL", fallback: "https://sid.demo.sk.ee/mock")
  static let smartIdDocumentNumber = variables["SMART_ID_DOCUMENT_NUMBER"] ?? "PNOEE-40404040009-MOCK-Q"
  static let screenshotDirectory = variables["E2E_IOS_SCREENSHOT_DIR"].map {
    URL(fileURLWithPath: $0, isDirectory: true)
  }

  static let loginTrafficUrl = page("/__login-traffic")

  static func page(_ pathAndQuery: String) -> URL {
    guard let page = URL(string: siteUrl.absoluteString + pathAndQuery) else {
      fatalError("Not a page of the tested site: pathAndQuery=\(pathAndQuery)")
    }
    return page
  }

  private static func url(named name: String, fallback: String) -> URL {
    let value = (variables[name] ?? fallback).replacingOccurrences(
      of: "/+$", with: "", options: .regularExpression)
    guard let url = URL(string: value) else {
      fatalError("Not a URL: \(name)=\(value)")
    }
    return url
  }
}
