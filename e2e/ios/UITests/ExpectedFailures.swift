import XCTest

enum ExpectedFailures {
  static let skMockServiceDigestsTheDecodedUserChallengeVerifier =
    "SK demo Mock Service: signature.userChallenge is SHA-256 of the Base64URL-decoded userChallengeVerifier, "
    + "while SK RP API docs (callback_urls: \"as is, without Base64URL decoding\") and smart-id-java-client 3.2 "
    + "hash it as is, so the backend rejects every Web2App login the Mock Service completes with "
    + "smart.id.validation.failed"

  static func expectLoggedInUnlessTheMockServiceRejectsIt(_ answer: TokenAnswer) {
    if answer == .rejected(errorCode: "smart.id.validation.failed") {
      XCTExpectFailure(skMockServiceDigestsTheDecodedUserChallengeVerifier)
    }
    XCTAssertEqual(answer, .loggedIn)
  }
}
