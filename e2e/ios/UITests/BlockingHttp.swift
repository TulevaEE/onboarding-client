import Foundation

struct HarnessError: Error, CustomStringConvertible {
  let description: String
}

enum BlockingHttp {
  static func send(_ request: URLRequest, timeout: TimeInterval) throws -> (Int, String) {
    var request = request
    request.timeoutInterval = timeout
    let answered = DispatchSemaphore(value: 0)
    var outcome: Result<(Int, String), Error> = .failure(
      HarnessError(description: "No answer: url=\(request.url?.absoluteString ?? "")"))
    URLSession.shared.dataTask(with: request) { data, response, error in
      if let error {
        outcome = .failure(error)
      } else {
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        outcome = .success((status, String(decoding: data ?? Data(), as: UTF8.self)))
      }
      answered.signal()
    }.resume()
    _ = answered.wait(timeout: .now() + timeout + 5)
    return try outcome.get()
  }
}
