import Foundation

struct SmartIdApp {
  private static let longestCallbackWaitTheMockServiceAllowsMillis = 30000
  private static let anyBrowserCookieTheMockServiceAccepts = "e2e=smart-id-app"

  let mockServiceUrl = E2EEnvironment.smartIdMockUrl
  let documentNumber = E2EEnvironment.smartIdDocumentNumber

  func confirm(deviceLink: URL) throws {
    var request = URLRequest(url: mockServiceUrl.appendingPathComponent("device-link"))
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONSerialization.data(withJSONObject: [
      "documentNumber": documentNumber,
      "deviceLink": deviceLink.absoluteString,
      "browserCookie": Self.anyBrowserCookieTheMockServiceAccepts,
      "disableCallbackGetRequest": true,
    ])
    let (status, body) = try BlockingHttp.send(request, timeout: 30)
    guard status == 200 else {
      throw HarnessError(
        description: "Mock Service did not confirm the device link: status=\(status), body=\(body)")
    }
  }

  func callbackUrl(web2AppLink: URL) throws -> URL {
    var components = URLComponents(
      url: mockServiceUrl.appendingPathComponent("device-link/callback-url/\(try sessionToken(of: web2AppLink))"),
      resolvingAgainstBaseURL: false)
    components?.queryItems = [
      URLQueryItem(name: "timeoutMs", value: String(Self.longestCallbackWaitTheMockServiceAllowsMillis))
    ]
    guard let url = components?.url else {
      throw HarnessError(description: "Cannot build the callback URL request: web2AppLink=\(web2AppLink)")
    }
    let timeout = TimeInterval(Self.longestCallbackWaitTheMockServiceAllowsMillis / 1000 + 5)
    let (status, body) = try BlockingHttp.send(URLRequest(url: url), timeout: timeout)
    guard status == 200,
      let json = try? JSONSerialization.jsonObject(with: Data(body.utf8)) as? [String: Any],
      let callbackUrl = (json["callbackUrl"] as? String).flatMap(URL.init(string:))
    else {
      throw HarnessError(
        description: "Mock Service returned no callback URL: status=\(status), body=\(body)")
    }
    return onTheTestedSite(callbackUrl)
  }

  func confirmAndReturn(web2AppLink: URL) throws -> URL {
    try confirm(deviceLink: web2AppLink)
    return try callbackUrl(web2AppLink: web2AppLink)
  }

  private func sessionToken(of deviceLink: URL) throws -> String {
    guard
      let sessionToken = URLComponents(url: deviceLink, resolvingAgainstBaseURL: false)?
        .queryItems?.first(where: { $0.name == "sessionToken" })?.value
    else {
      throw HarnessError(description: "Device link has no sessionToken: deviceLink=\(deviceLink)")
    }
    return sessionToken
  }

  private func onTheTestedSite(_ callbackUrl: URL) -> URL {
    let site = E2EEnvironment.siteUrl
    var callback = URLComponents(url: callbackUrl, resolvingAgainstBaseURL: false)
    callback?.scheme = site.scheme
    callback?.host = site.host
    callback?.port = site.port
    return callback?.url ?? callbackUrl
  }
}
