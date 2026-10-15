import Foundation

enum TokenAnswer: Equatable {
  case loggedIn
  case rejected(errorCode: String)
}

struct LoginExchange: Decodable {
  let method: String
  let path: String
  let status: Int
  let web2AppLink: String?
  let errorCode: String?
  let accessTokenIssued: Bool

  var isLoginStart: Bool { method == "POST" && path == "/v1/smart-id/login" }

  var isCallback: Bool { method == "POST" && path == "/v1/smart-id/login/callback" }

  var isFinalTokenAnswer: Bool {
    method == "POST" && path == "/oauth/token"
      && (accessTokenIssued || (errorCode != nil && errorCode != "AUTHENTICATION_NOT_COMPLETE"))
  }

  var tokenAnswer: TokenAnswer {
    accessTokenIssued ? .loggedIn : .rejected(errorCode: errorCode ?? "HTTP \(status)")
  }
}

private struct RecordedExchanges: Decodable {
  let count: Int
  let exchanges: [LoginExchange]
}

struct LoginTraffic {
  private static let longestWaitForTheBrowserSeconds: TimeInterval = 60

  func mark() throws -> Int {
    try recorded(since: 0).count
  }

  func web2AppLink(since mark: Int) throws -> URL {
    try waitFor("Smart-ID login start", since: mark) { exchange in
      exchange.isLoginStart ? exchange.web2AppLink.flatMap(URL.init(string:)) : nil
    }
  }

  func callbackAnswer(since mark: Int) throws -> LoginExchange {
    try waitFor("Smart-ID callback", since: mark) { exchange in exchange.isCallback ? exchange : nil }
  }

  func finalTokenAnswer(since mark: Int) throws -> TokenAnswer {
    try waitFor("final token answer", since: mark) { exchange in
      exchange.isFinalTokenAnswer ? exchange.tokenAnswer : nil
    }
  }

  private func waitFor<T>(_ description: String, since mark: Int, _ find: (LoginExchange) -> T?) throws -> T {
    let deadline = Date().addingTimeInterval(Self.longestWaitForTheBrowserSeconds)
    repeat {
      if let found = try recorded(since: mark).exchanges.lazy.compactMap(find).first {
        return found
      }
      Thread.sleep(forTimeInterval: 0.25)
    } while Date() < deadline
    throw HarnessError(
      description: "Browser sent no \(description): waitedSeconds=\(Int(Self.longestWaitForTheBrowserSeconds))")
  }

  private func recorded(since mark: Int) throws -> RecordedExchanges {
    var components = URLComponents(url: E2EEnvironment.loginTrafficUrl, resolvingAgainstBaseURL: false)
    components?.queryItems = [URLQueryItem(name: "since", value: String(mark))]
    guard let url = components?.url else {
      throw HarnessError(description: "Cannot build the login traffic request: since=\(mark)")
    }
    let (status, body) = try BlockingHttp.send(URLRequest(url: url), timeout: 10)
    guard status == 200 else {
      throw HarnessError(description: "Login traffic recorder answered: status=\(status), body=\(body)")
    }
    return try JSONDecoder().decode(RecordedExchanges.self, from: Data(body.utf8))
  }
}
