import XCTest

final class Evidence {
  private let testCase: XCTestCase
  private var shots = 0

  init(of testCase: XCTestCase) {
    self.testCase = testCase
  }

  func screenshot(_ name: String) {
    shots += 1
    let fileName = String(format: "%02d-%@", shots, name)
    let screenshot = XCUIScreen.main.screenshot()
    let attachment = XCTAttachment(screenshot: screenshot)
    attachment.name = fileName
    attachment.lifetime = .keepAlways
    testCase.add(attachment)
    write(screenshot.pngRepresentation, named: "\(fileName).png")
  }

  func note(_ text: String, named name: String) {
    let attachment = XCTAttachment(string: text)
    attachment.name = name
    attachment.lifetime = .keepAlways
    testCase.add(attachment)
    write(Data(text.utf8), named: "\(name).txt")
  }

  private var scenarioDirectory: URL? {
    let scenario = testCase.name
      .trimmingCharacters(in: CharacterSet(charactersIn: "-[]"))
      .replacingOccurrences(of: " ", with: ".")
    return E2EEnvironment.screenshotDirectory?.appendingPathComponent(scenario, isDirectory: true)
  }

  private func write(_ data: Data, named name: String) {
    guard let directory = scenarioDirectory else { return }
    try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    try? data.write(to: directory.appendingPathComponent(name))
  }
}
