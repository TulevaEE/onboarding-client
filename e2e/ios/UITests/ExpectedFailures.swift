import XCTest

enum ExpectedFailures {
  static let skMockServiceDigestsTheDecodedUserChallengeVerifier =
    "SK demo Mock Service: signature.userChallenge is SHA-256 of the Base64URL-decoded userChallengeVerifier, "
    + "while SK RP API docs (callback_urls: \"as is, without Base64URL decoding\") and smart-id-java-client 3.2 "
    + "hash it as is, so the backend rejects every Web2App login the Mock Service completes with "
    + "smart.id.validation.failed"

  static let release2OpenInSafariFromTheInAppBrowser =
    "Release 2: in-app browsers (FBAN/, FBAV/, FB_IAB/, Instagram, Barcelona, GSA/, LinkedInApp, musical_ly, "
    + "BytedanceWebview) show \"Ava brauseris\" on the Smart-ID login tab (contract in "
    + "e2e/support/wayOutOfInAppBrowsers.ts); for Facebook on iPhone a link or window.open opens x-safari-https://... "
    + "with the same path and query, so Safari opens the login; until then the in-app browser has no way out"

  static func expectLoggedInUnlessTheMockServiceRejectsIt(_ answer: TokenAnswer) {
    if answer == .rejected(errorCode: "smart.id.validation.failed") {
      XCTExpectFailure(skMockServiceDigestsTheDecodedUserChallengeVerifier)
    }
    XCTAssertEqual(answer, .loggedIn)
  }
}
