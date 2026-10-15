import SwiftUI
import UIKit
import WebKit

@main
struct InAppBrowserApp: App {
  var body: some Scene {
    WindowGroup {
      InAppBrowserView().ignoresSafeArea(.container, edges: .bottom)
    }
  }
}

struct InAppBrowserView: UIViewControllerRepresentable {
  func makeUIViewController(context: Context) -> InAppBrowserController { InAppBrowserController() }
  func updateUIViewController(_ controller: InAppBrowserController, context: Context) {}
}

enum LaunchSettings {
  private static let variables = ProcessInfo.processInfo.environment
  static let startUrl = variables["IN_APP_BROWSER_START_URL"].flatMap(URL.init(string:))
  static let userAgent = variables["IN_APP_BROWSER_USER_AGENT"]
}

final class InAppBrowserController: UIViewController, WKNavigationDelegate, WKUIDelegate {
  private static let schemesTheWebViewLoadsItself: Set<String> = ["http", "https", "about", "data", "blob"]

  private let addressBar = UILabel()
  private let handedToOtherApps = UILabel()
  private let webView = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
  private var addressObservation: NSKeyValueObservation?
  private var handOffs: [String] = []

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .systemBackground
    configureWebView()
    configureAddressBar()
    configureHandOffLog()
    layOut()
    if let startUrl = LaunchSettings.startUrl {
      webView.load(URLRequest(url: startUrl))
    }
  }

  private func configureWebView() {
    webView.customUserAgent = LaunchSettings.userAgent
    webView.isInspectable = true
    webView.navigationDelegate = self
    webView.uiDelegate = self
    addressObservation = webView.observe(\.url, options: [.initial, .new]) { [weak self] webView, _ in
      self?.addressBar.text = webView.url?.absoluteString ?? ""
    }
  }

  private func configureAddressBar() {
    addressBar.accessibilityIdentifier = "InAppBrowserAddress"
    addressBar.font = .systemFont(ofSize: 11)
    addressBar.textAlignment = .center
    addressBar.lineBreakMode = .byTruncatingMiddle
    addressBar.backgroundColor = .secondarySystemBackground
  }

  private func configureHandOffLog() {
    handedToOtherApps.accessibilityIdentifier = "InAppBrowserHandOffs"
    handedToOtherApps.font = .monospacedSystemFont(ofSize: 9, weight: .regular)
    handedToOtherApps.numberOfLines = 3
  }

  private func layOut() {
    [addressBar, webView, handedToOtherApps].forEach {
      $0.translatesAutoresizingMaskIntoConstraints = false
      view.addSubview($0)
    }
    NSLayoutConstraint.activate([
      addressBar.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
      addressBar.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 8),
      addressBar.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -8),
      addressBar.heightAnchor.constraint(equalToConstant: 28),
      webView.topAnchor.constraint(equalTo: addressBar.bottomAnchor),
      webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      webView.bottomAnchor.constraint(equalTo: handedToOtherApps.topAnchor),
      handedToOtherApps.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 8),
      handedToOtherApps.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -8),
      handedToOtherApps.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
    ])
  }

  private func handToTheSystem(_ url: URL) {
    UIApplication.shared.open(url) { [weak self] opened in
      self?.recordHandOff("\(url.absoluteString) opened=\(opened)")
    }
  }

  private func recordHandOff(_ line: String) {
    handOffs.append(line)
    handedToOtherApps.text = handOffs.suffix(3).joined(separator: "\n")
  }

  func webView(
    _ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
    decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
  ) {
    guard let url = action.request.url,
      let scheme = url.scheme?.lowercased(),
      !Self.schemesTheWebViewLoadsItself.contains(scheme)
    else {
      decisionHandler(.allow)
      return
    }
    decisionHandler(.cancel)
    handToTheSystem(url)
  }

  func webView(
    _ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
    for action: WKNavigationAction, windowFeatures: WKWindowFeatures
  ) -> WKWebView? {
    webView.load(action.request)
    return nil
  }
}
