# Login scenarios on a real Android phone

The Playwright scenarios in `e2e/tests/` emulate phones. These run the same logins on a real Android phone
over USB: real Chrome, real Samsung Internet, the real hand-over from one browser to the other. The phone
opens the local client's dev server, and SK's demo Mock Service plays the Smart-ID app, exactly as in the
emulated scenarios. Nothing here talks to production.

## Run it

```bash
e2e/stack/up.sh                      # local backend + client, see e2e/README.md
ANDROID_SERIAL=<serial> npm run test:e2e:android    # or e2e/android/run.sh
npx playwright show-report e2e/android/out/report
```

`run.sh` checks that one phone is connected and unlocked and that the client answers, then runs the scenarios
in `scenarios/` with one worker (there is one phone). Arguments go to Playwright, so
`e2e/android/run.sh FromAnotherBrowser` runs one file. A full run takes about two and a half minutes.

| Variable | Default | |
| --- | --- | --- |
| `ADB` | `adb` on `PATH`, then `$ANDROID_HOME/platform-tools/adb` | e.g. `/opt/homebrew/share/android-commandlinetools/platform-tools/adb` |
| `ANDROID_SERIAL` | the only connected device | `adb devices -l` lists serials |
| `E2E_ANDROID_OUT` | `e2e/android/out` (gitignored) | screenshots, traffic log, report |
| `E2E_ANDROID_ATTENDED` | `false` | `true` runs the Messenger scenario, which needs a person |
| `E2E_ANDROID_ATTENDED_WAIT_SECONDS` | `180` | how long the Messenger scenario waits for the person |
| `E2E_BASE_URL`, `SMART_ID_MOCK_URL`, `SMART_ID_DOCUMENT_NUMBER` | as in `e2e/README.md` | `E2E_BASE_URL` must be plain `http://localhost:<port>` |

### What the phone needs

- USB debugging allowed for this computer, the screen unlocked (the run wakes the screen but cannot unlock it).
- Chrome as the default browser and Samsung Internet installed (the scenarios check the default and stop if it
  is something else).
- No SK demo Smart-ID app. Demo device links do not open the live Smart-ID app, so the browser shows SK's
  "Ei saanud avada Smart-ID rakendust!" page and the Mock Service confirms the login instead; the scenarios
  wait for that page.
- Browser first-run screens and notices dealt with by hand once. The run declines Samsung Internet's "Make
  Samsung Browser your default browser?" offer with "Not now" and taps nothing else: any other sheet stops the
  run with a screenshot of it.

The run changes no settings. It opens new tabs in Chrome and Samsung Internet. At the end it closes every
Chrome tab on `http(s)://localhost:<port>/` or `https://sid.demo.sk.ee/device-link` through Chrome's DevTools
socket (`adb forward … localabstract:chrome_devtools_remote`, `/json/list` and `/json/close`), and touches no
other tab, then goes to the home screen. Samsung Internet's DevTools socket lists no tabs, so its test tabs stay
open; close them by hand.
The Chrome cookies the run leaves for `localhost:<port>` are the local stack's.

## How it works

- **Reaching the laptop.** `adb reverse tcp:<port>` makes `http://localhost:<port>` on the phone the laptop's
  client, so cookies are same-origin like production. The reverse is removed at the end of the run.
- **Seeing what the phone's browser got.** The reverse points at a small recording proxy
  (`support/loginTraffic.ts`) in front of the dev server. It writes the four login exchanges, never tokens, to
  `out/login-traffic.jsonl`: the Web2App link from `POST /v1/smart-id/login`, the QR link from
  `GET /v1/smart-id/login/qr-code`, the answer to `POST /v1/smart-id/login/callback` and the final answer of
  `POST /oauth/token`. Chrome's address bar shows the whole device link and is checked against it; Samsung
  Internet's shows only the host.
- **Playing the Smart-ID app.** The link goes to the Mock Service from the laptop (`support/smartIdApp.ts`), and
  its callback URL, moved onto `E2E_BASE_URL`, is opened with `am start -a android.intent.action.VIEW` and no
  package, so Android hands it to the default browser the way the Smart-ID app does. Chrome opens it in a new
  tab: same cookies as every other Chrome tab, its own `sessionStorage`.
- **Reading the screen.** `uiautomator dump` lists the texts and accessibility labels Chrome and Samsung Internet
  expose for the page; taps go to the centre of the matching element. Each step saves a screenshot to
  `out/screens/<scenario>/<test>/NN-<step>.png`, but only while Chrome, Samsung Internet or Messenger's in-app
  browser is in front.

## Scenarios

| Scenario | Proves | Today |
| --- | --- | --- |
| QR code shown in Chrome on the phone | a phone completes a login against this stack and lands back on the deep link `/3rd-pillar-payment`; the logged-in check works on the device | passes |
| Login started in Chrome, the default browser: Chrome opens the Smart-ID app link and offers no way out of Chrome | the device link Chrome navigates to is the one the backend issued; no "Ava brauseris" or "Jätka siin" in a normal browser | passes |
| ... Chrome sends the callback with the session cookie that started the login | the callback the Smart-ID app hands to the default browser lands in a new Chrome tab and is accepted (HTTP 200) | passes |
| ... logs the person in on the account page | Web2App end to end | expected failure: Mock Service |
| Login started in Samsung Internet, Chrome holds no login of its own: Samsung Internet opens the Smart-ID app link | the start request carries Samsung Internet's user agent; no way out of Samsung Internet | passes |
| ... tells the person in Chrome to log in there | callback answers `auth.session.not.found`; Chrome shows "Smart‑ID avas Tuleva teises brauseris või aknas…" and "Proovi uuesti" | passes |
| ... logs the person in in Chrome after Proovi uuesti | one tap starts a new login in Chrome; its callback is accepted | expected failure: Mock Service |
| ... brings the person back to `/3rd-pillar-payment` after Proovi uuesti | Web2App end to end with the return path | expected failure: Mock Service |
| Login started in Samsung Internet, Chrome holds an unfinished login of its own: tells the person in Chrome to log in there | callback answers `smart.id.callback.invalid`; Chrome shows the same "Smart‑ID avas Tuleva teises brauseris või aknas…" and "Proovi uuesti" | passes |
| Messenger's in-app browser (attended) | see below | not run |

"Chrome holds no login of its own" is arranged by logging in with the QR code in Chrome first, because a
completed login is the only way to clear the backend session without touching Chrome's data.

### An unfinished login in the default browser

The backend keeps a Smart-ID login in the browser's HTTP session until a token is issued; a failed or abandoned
login stays there. When the Smart-ID app returns a login that another browser started to a browser holding such a
login, `POST /v1/smart-id/login/callback` answers `smart.id.callback.invalid` ("Callback token mismatch") instead
of `auth.session.not.found`. The page tells the person to log in there for both answers.

### Messenger's in-app browser: attended

There is no way to open Messenger's in-app browser on a link without a chat: its browser activity is not
exported, and its public entry points (`m.me`, `fb-messenger://`, share) all go through conversations. The run
never sends messages, so this scenario needs a person:

1. In Messenger, open "Open links in external browser" and switch it off. With it on, Messenger hands every link
   to Chrome and the in-app browser never opens. This is your setting; switch it back afterwards.
2. Send yourself `http://localhost:3200/3rd-pillar-payment?utm_source=e2e&fbclid=abc` in a chat only you are in.
   Messenger may not turn a `localhost` address into a link; if it does not, this scenario cannot run as is.
3. Run `E2E_ANDROID_ATTENDED=true ANDROID_SERIAL=<serial> e2e/android/run.sh messengerInAppBrowser` and tap the
   link within `E2E_ANDROID_ATTENDED_WAIT_SECONDS`.

The run reads only the foreground activity's name while it waits, and reads or captures the screen only once
Messenger's in-app browser (`com.facebook.browser.lite.BrowserLiteActivity`) is in front. It then checks:

- the login page loads in the in-app browser;
- "Ava brauseris" is offered; tapping it and Messenger's "CONTINUE" brings Chrome
  to the front on the same path and query. Release 2's `intent://` link uses `scheme=https`, so against the plain
  HTTP dev server Chrome shows a connection error for `https://localhost:3200/…`; the scenario checks only the
  address.
