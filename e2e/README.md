# Login end-to-end scenarios

Playwright scenarios that log in to a local stack (onboarding-service backend + this client's dev server)
with Smart-ID on SK's **demo** environment. Nothing here talks to production: the backend runs with the
`dev,mock` profiles, Smart-ID goes to `sid.demo.sk.ee`, and the person is SK's synthetic test account.

## Run it locally

```bash
npm ci
npx playwright install chromium webkit

E2E_BACKEND_DIR=/path/to/onboarding-service e2e/stack/up.sh
npm run test:e2e
e2e/stack/down.sh
```

`up.sh` builds the backend jar when there is none (`./gradlew bootJar -x test`), creates the database when
it is missing, starts the backend and the client dev server in the background and waits until both answer.
Running it again while the stack is up does nothing. Logs and PID files go to `e2e/.stack/`
(`backend.log`, `client.log`). `down.sh` stops both.

Point `E2E_BACKEND_DIR` at a checkout nobody else builds in (a `git worktree` of onboarding-service works
well): `up.sh` writes to its `build/` directory.

Useful while writing scenarios:

```bash
npm run test:e2e -- --project iphone-safari
npm run test:e2e -- --headed -g "another browser"
npx playwright show-report e2e/playwright-report
```

## Configuration

Everything comes from environment variables; the defaults suit a laptop with Postgres on 5432.

| Variable | Default | Used by |
| --- | --- | --- |
| `E2E_BACKEND_DIR` | none, required | stack: onboarding-service checkout to build and run |
| `E2E_BACKEND_BUILD` | `when-missing` | stack: `always` rebuilds the jar |
| `E2E_BACKEND_PORT` | `9000` | stack |
| `E2E_CLIENT_PORT` | `3200` | stack |
| `E2E_CLIENT_HTTPS` | `false` | stack: `true` serves the dev server over HTTPS with a self-signed certificate |
| `E2E_BASE_URL` | `http://localhost:3200` (`https://` when `E2E_CLIENT_HTTPS=true`) | stack and tests |
| `E2E_SMART_ID_CALLBACK_ORIGIN` | `https://localhost:$E2E_CLIENT_PORT` | stack: the backend's `FRONTEND_URL` |
| `E2E_DATABASE_HOST` / `_PORT` / `_NAME` | `localhost` / `5432` / `tuleva_onboarding_e2e` | stack |
| `E2E_DATABASE_USERNAME` / `_PASSWORD` | `tuleva-onboarding` / `tuleva-onboarding` | stack |
| `E2E_CREATE_DATABASE` | `true` | stack: creates the database with `psql`/`createdb` when missing |
| `E2E_STARTUP_TIMEOUT_SECONDS` | `300` | stack |
| `E2E_STATE_DIR` | `e2e/.stack` | stack: logs, PID files, throwaway keystore |
| `SMART_ID_MOCK_URL` | `https://sid.demo.sk.ee/mock` | tests |
| `SMART_ID_DOCUMENT_NUMBER` | `PNOEE-40404040009-MOCK-Q` | tests: SK test account the Smart-ID app answers for |
| `E2E_WORKERS` | `2` | tests |

## How the Smart-ID app is played

SK's [Mock Service](https://sk-eid.github.io/smart-id-documentation/rp-api/mock_service.html)
([OpenAPI](https://sk-eid.github.io/smart-id-documentation/_/static/autosigner.yml)) stands in for the person's
phone:

1. The page starts the login. On a phone it navigates to the Web2App link to open the Smart-ID app; the
   scenario answers that navigation with `204 No Content`, so the tab stays on the login page the way it does
   when the app opens, and reads the link from the `POST /v1/smart-id/login` response. On a computer it reads
   the QR code's link from `GET /v1/smart-id/login/qr-code`.
2. `POST /mock/device-link` with the link and the test document number confirms the login. `browserCookie`
   must look like a cookie header (`name=value`); a bare string is rejected.
3. For Web2App, `GET /mock/device-link/callback-url/{sessionToken}` returns the URL the Smart-ID app would open.
   The scenario opens it where the scenario needs it:
   - a new page in the same `BrowserContext` is a new tab of the browser that started the login;
   - a page in a fresh `BrowserContext` (the `anotherBrowser` fixture, optionally with another browser's user
     agent) is another browser, an in-app browser or a private tab: none of them has the login's session cookie.

SK only accepts an HTTPS `initialCallbackUrl`, so the backend gets `FRONTEND_URL=https://localhost:3200` while
the dev server serves plain HTTP. The callback URL the Mock Service returns is therefore moved onto
`E2E_BASE_URL` (scheme, host and port) before it is opened; its query is untouched, and the backend checks only
the query. Serving the dev server over HTTPS (`E2E_CLIENT_HTTPS=true`, Playwright ignores the self-signed
certificate) works as well and makes the rewrite a no-op; both were run.

## Scenarios

Each project runs the scenarios of its device: `tests/phone/` on both phones, `tests/iphone/` on `iphone-safari`
(WebKit), `tests/android/` on `android-chrome` (Chromium) and `tests/desktop/` on `desktop-chrome`. Another browser
or an in-app browser is the project's engine with that browser's user agent.

| Scenario | Projects | Proves | Today |
| --- | --- | --- | --- |
| QR code on a computer logs the person in on the account page | desktop-chrome | QR flow end to end with the backend's full response validation | passes |
| QR code on a computer brings the person back to the page they were sent to log in from | desktop-chrome | return path for a logged-out deep link | passes |
| QR code on a phone brings the person back to the deep link | iphone-safari, android-chrome | phones can complete a login against this stack | passes |
| Smart-ID returns to a new tab of the same browser: callback accepted | iphone-safari, android-chrome | the callback carries the session cookie that started the login | passes |
| Smart-ID returns to a new tab of the same browser: logged in on the account page | iphone-safari, android-chrome | Web2App end to end | expected failure: Mock Service |
| Smart-ID returns to a new tab of the same browser from a deep link: back on the deep link | iphone-safari, android-chrome | Release 1 return path | expected failure: Mock Service and Release 1 |
| Smart-ID returns a login started in Safari to Chrome (iPhone), or in Chrome to Samsung Internet (Android): the person is told to log in there | iphone-safari, android-chrome | `auth.session.not.found` becomes "Smart‑ID avas Tuleva teises brauseris või aknas…" with "Proovi uuesti" | passes |
| … after "Proovi uuesti" there: the callback Smart-ID returns to that browser is accepted | iphone-safari, android-chrome | Try again starts a login in the returning browser's own session | passes |
| … after "Proovi uuesti" there: logged in | iphone-safari, android-chrome | the restart completes | expected failure: Mock Service |
| … after "Proovi uuesti" there: back on the deep link the login started from | iphone-safari, android-chrome | Release 1 | expected failure: Release 1, masked by the Mock Service until SK fixes it |
| A login started in Safari keeps returning to a new private tab: told again after "Proovi uuesti" | iphone-safari | the iOS private-tab loop is a known limitation; the page keeps telling the truth | passes |
| In-app browsers offer the shared link in the phone browser | iphone-safari: Facebook, Messenger, Instagram, Threads, Google app; android-chrome: Facebook, Messenger, TikTok | Release 2 way out, keeping the path and the full query | expected failure: Release 2 |
| In-app browsers keep "Jätka siin", which opens the Smart-ID app with one tap | same | Release 2 keeps today's flow | expected failure: Release 2 |
| Until Release 2, in-app browsers get only the Smart-ID button | same | today's behavior on record | passes; delete these with Release 2 |
| Normal browsers offer no way out | iphone-safari: Safari on iOS 26 and 27, Chrome; android-chrome: Chrome, Samsung Internet; desktop-chrome | the way out stays invisible outside in-app browsers, even for a link carrying `fbclid` | passes |

### Release 2: what the in-app scenarios expect

`support/wayOutOfInAppBrowsers.ts` holds the contract. For a person sent from `/3rd-pillar-payment?utm_source=e2e&fbclid=abc`
to the login page, the Smart-ID tab shows "Ava brauseris" and "Jätka siin" (proposed copy: change
`OPEN_IN_THE_BROWSER` and `CONTINUE_HERE` if the translations end up different). The way out opens the page the person
was sent from, with its full query, always over `https` (`H` is the tested host):

| In-app browser | Control | Address |
| --- | --- | --- |
| Android (Facebook, Messenger, TikTok) | link | `intent://H/3rd-pillar-payment?utm_source=e2e&fbclid=abc#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=https%3A%2F%2FH%2F3rd-pillar-payment%3Futm_source%3De2e%26fbclid%3Dabc;end` |
| iPhone Messenger, Google app | link | `x-safari-https://H/3rd-pillar-payment?utm_source=e2e&fbclid=abc` |
| iPhone Facebook, Threads | link or button calling `window.open` | `x-safari-https://H/3rd-pillar-payment?utm_source=e2e&fbclid=abc` |
| iPhone Instagram | link | `instagram://extbrowser/?url=https%3A%2F%2FH%2F3rd-pillar-payment%3Futm_source%3De2e%26fbclid%3Dabc` |

LinkedIn (`LinkedInApp`) is in the detection list but has no scenario until its way out is decided. The "until
Release 2" scenarios fail the day any way out appears in an in-app browser, which is the reminder to delete them
together with the `test.fail` lines.

### Expected failures

A scenario for behavior that does not exist yet calls `test.fail(true, <reason>)` with a reason from
`support/expectedFailures.ts`. Playwright counts it as passing while it fails, and reports it as failing the
day it passes: that is the signal to delete the `test.fail` line.

### Known blocker: the Mock Service cannot complete a Web2App login

For Web2App the Mock Service signs `signature.userChallenge = Base64URL(SHA-256(Base64URL-decode(userChallengeVerifier)))`.
SK's own [callback URL rules](https://sk-eid.github.io/smart-id-documentation/rp-api/callback_urls.html) say to
hash `userChallengeVerifier` "as is, without Base64URL decoding", and so does smart-id-java-client 3.2, the
library the backend validates production logins with. So the backend accepts the callback, then answers the token
request with `smart.id.validation.failed`. Checked by hand on two sessions: the digest of the decoded
verifier matches the session's `userChallenge`, the digest of the verifier as is does not. QR logins are not
affected because the user challenge is only checked for Web2App and App2App.

`expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt` marks a Web2App scenario as an expected failure only
when the token endpoint answers exactly that error, so any other failure still turns the suite red and the
scenarios start passing on their own once SK fixes the Mock Service. Until then, Web2App scenarios can assert
everything up to the accepted callback (cookie continuity, what the callback page shows), but not a completed
login.

## What the stack does to stay off production

- The backend process starts from an empty environment (`env -i`), so nothing exported in the shell (AWS
  profiles, API tokens) reaches it. It gets throwaway AWS credentials, a throwaway SEB keystore generated with
  `keytool`, and `127.0.0.1:9` for OpenSanctions, Mandrill, Mailchimp, Äriregister and Directo.
- `dev` keeps Smart-ID and Mobile-ID on SK's demo environment; `mock` replaces EPIS and the population register.
- The S3 call the backend makes at startup fails with HTTP 403 for the throwaway key and is logged as an error;
  that is expected.

## In CI later

- Java 25 to build and run the backend, Node as in `.nvmrc`, `npx playwright install --with-deps chromium webkit`.
- A PostgreSQL 18 service with the database named in `E2E_DATABASE_NAME` (then `E2E_CREATE_DATABASE=false`).
- Outbound HTTPS to `sid.demo.sk.ee` (Smart-ID RP API v3 and the Mock Service).
- Both repositories checked out; `E2E_BACKEND_DIR` points at onboarding-service.
- `CI=true` turns on one retry and `forbidOnly`; keep `e2e/playwright-report` and `e2e/test-results` as artifacts.

Real devices are outside this suite. `e2e/android/` runs the logins on an Android phone over USB
(`npm run test:e2e:android`, see [android/README.md](android/README.md)). `e2e/ios/` runs them in real Safari and
a model in-app browser on an iOS Simulator (`npm run test:e2e:ios`, see [ios/README.md](ios/README.md)), including
where iOS opens the callback (a new tab, or a new private tab). What a real in-app browser does with a Web2App or
`intent://` link, and whether the Smart-ID app opens at all, are checked by hand.
