# Login scenarios on an iOS Simulator

The Playwright scenarios in `e2e/tests/` emulate an iPhone with WebKit. These run the logins in real Safari on an
iOS Simulator, driven by XCUITest: real tabs, real private browsing, and iOS handing a URL from another app to the
default browser. A small app with a `WKWebView` stands in for Facebook's in-app browser. The simulator opens the
local client's dev server through a login traffic recorder, and SK's demo Mock Service plays the Smart-ID app,
exactly as in the Playwright scenarios. Nothing here talks to production.

## Run it

```bash
e2e/stack/up.sh                                   # local backend + client, see e2e/README.md
SIMULATOR_UDID=<udid> npm run test:e2e:ios        # or e2e/ios/run.sh
SIMULATOR_UDID=<udid> e2e/ios/run.sh -only-testing:LoginE2EUITests/SafariPrivateTabTests
```

`run.sh` checks that the client answers, boots the simulator if it is not running and keeps its keyboard still
(see "Known slowness"), generates `LoginE2E.xcodeproj` with xcodegen, builds the in-app browser app and the UI
tests, starts the login traffic recorder and runs the scenarios one at a time. Arguments go to
`xcodebuild test-without-building`. A full run takes about nine minutes, most of it Safari restarting and clearing
itself before each scenario. Screenshots land in `e2e/ios/results/screenshots/<class>.<test>/`, the result bundle
in `e2e/ios/results/LoginE2E.xcresult` (open it in Xcode, or `xcrun xcresulttool get test-results tests --path …`).

| Variable | Default | |
| --- | --- | --- |
| `SIMULATOR_UDID` | none, required | an iPhone simulator: `xcrun simctl list devices available`; create one with `xcrun simctl create tuleva-login-e2e "iPhone 17"` |
| `DEVELOPER_DIR` | `/Applications/Xcode.app/Contents/Developer` | Xcode 27 or newer |
| `E2E_IOS_BUILD_DIR` | `e2e/ios/build` (gitignored) | derived data |
| `E2E_IOS_RESULTS_DIR` | `e2e/ios/results` (gitignored) | screenshots and result bundle, replaced on every run |
| `E2E_IOS_RECORDER_PORT` | `3290` | the login traffic recorder; Safari and the in-app browser open `http://localhost:<port>` |
| `E2E_BASE_URL`, `SMART_ID_MOCK_URL`, `SMART_ID_DOCUMENT_NUMBER` | as in `e2e/README.md` | `E2E_BASE_URL` must be plain `http`; the others reach the tests as `TEST_RUNNER_*` variables |

The simulator shares the Mac's network, so `localhost` is the Mac. No Simulator.app window is needed: XCUITest
drives a headless simulator.

## How the scenarios play the phone

1. The person taps "Sisenen". With no Smart-ID app installed, iOS does not open an app for the Web2App link, so
   the browser shows SK's "Ei saanud avada Smart-ID rakendust!" page. The scenario takes the link from the login
   start the recorder saw (Safari) or from the address shown above the page (in-app browser).
2. The UI test process calls the Mock Service itself (`UITests/SmartIdApp.swift`, the same three steps as
   `support/smartIdApp.ts`) and moves the callback URL onto the recorder's address.
3. `XCUIDevice.shared.system.open(callbackUrl)` opens the callback the way the Smart-ID app does: iOS hands it to
   the default browser, Safari, which opens it in a new tab of the mode it is in, normal or private.

Every scenario starts by restarting Safari and clearing it: it opens the login page (Clear History is disabled while
the history is empty), then clears "All history" with "Close All Tabs" on. That also clears cookies, so no scenario inherits a
Tuleva session from an earlier one. This matters: a Safari that still holds an unfinished Tuleva login of its own
answers another browser's callback differently (see the scenarios). The run leaves Safari in a normal tab.

The in-app browser (`InAppBrowser/`) sends Facebook's iPhone user agent, loads `http` and `https` itself, hands
every other scheme (`x-safari-https://`, `instagram://`) to iOS, and loads `window.open` targets in the same view.
That is a model of Facebook's in-app browser built on plain `WKWebView`, not Facebook's app: what Facebook itself
does with a Web2App link is checked by hand.

`loginTrafficRecorder.mjs` forwards everything to the client dev server and records the answers to the Smart-ID
login start, the QR code, the callback and the token request, which the tests read from `/__login-traffic`. That
is how a scenario knows the Web2App link, that the callback was accepted or answered `auth.session.not.found`, and
the exact token error, without reading Safari's address bar or network. It is the iOS twin of
`e2e/android/support/loginTraffic.ts`.

## Scenarios

| Scenario | Proves | Today |
| --- | --- | --- |
| `SafariNormalTabTests` Smart-ID app returns to a new normal tab which logs the person in on the account page | the callback opens in a new normal tab, carries the session cookie (no "teises brauseris" message) and the login completes | expected failure at the last step: Mock Service |
| `SafariNormalTabTests` QR code shown on the phone logs the person in on the account page | a full login in Safari against this stack | passes |
| `SafariPrivateTabTests` Smart-ID app returns to a new private tab which tells the person to log in there | iOS opens the callback in another private tab, isolated from the one that started the login; the PR #1663 message and "Proovi uuesti" | passes |
| `SafariPrivateTabTests` Try again in the private tab Smart-ID opened loops into yet another private tab | "Proovi uuesti" starts a new login in that private tab, its callback lands in a third private tab with the same message | passes: the known private-tab limitation on record |
| `FacebookInAppBrowserTests` tapping Sisenen leaves the person on SK's could-not-open-the-app page inside the in-app browser | the in-app browser loads the Web2App link itself, hands nothing to iOS, and Safari stays in the background | passes: today's dead end on record |
| `FacebookInAppBrowserTests` Smart-ID app returning to Safari tells the person to log in there | Safari has no session from the in-app browser: the PR #1663 message | passes |
| `FacebookInAppBrowserTests` Smart-ID app returning to a Safari with an unfinished login of its own tells the person to log in there | the backend answers `smart.id.callback.invalid` ("Callback token mismatch") instead of `auth.session.not.found`, and the page shows the same "Smart‑ID avas Tuleva teises brauseris või aknas…" | passes |
| `FacebookInAppBrowserTests` offers to open the same login address in Safari | Release 2: "Ava brauseris" on the Smart-ID tab hands `/login?utm_source=e2e` to Safari | expected failure: Release 2 |

### Expected failures

A scenario for behavior that does not exist yet calls `XCTExpectFailure` with a reason from
`UITests/ExpectedFailures.swift`. XCTest counts it as passing while it fails, and fails it the day nothing fails
any more: that is the signal to delete the line.

The normal-tab Web2App scenario expects the failure only when the token request answers exactly
`smart.id.validation.failed`, the Mock Service deviation described in `e2e/README.md` (the page shows it as the
generic login error). Any other answer fails the run, and the scenario starts passing on its own once SK fixes the
Mock Service.

The Release 2 scenario looks for a link or button named "Ava brauseris", the proposed copy in
`support/wayOutOfInAppBrowsers.ts`, and compares Safari's address with the in-app address without the scheme:
`x-safari-https://` always opens `https`, while the local dev server serves `http`.

### Known slowness

XCUITest waits up to 60 seconds before and after every step for Safari to stop animating. While the iOS keyboard is
on screen, Safari often never reports that it has, and every step then costs a minute or two; slow enough for SK's
session to expire. So the scenarios never type into Safari: pages open through `system.open`, links come from the
recorder, and the account page is recognised by its title. Only the clearing before each scenario still opens
Safari's address bar to reach History, which is why each scenario restarts Safari afterwards. `run.sh` also turns
off the keyboard's Slide to Type introduction, prediction and autocorrection in the simulator, and each scenario may
run for ten minutes. If every step of a run stalls, reboot the simulator (`xcrun simctl shutdown "$SIMULATOR_UDID"`;
`run.sh` boots it again).

## In CI later

- A macOS runner with Xcode 27 (`DEVELOPER_DIR`), xcodegen, and an iPhone simulator created by the job
  (`xcrun simctl create`); `run.sh` boots it.
- The stack from `e2e/stack/up.sh` on the same machine, and outbound HTTPS to `sid.demo.sk.ee`.
- Keep `e2e/ios/results` as an artifact.
