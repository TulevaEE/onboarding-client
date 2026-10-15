import { expect, test } from '@playwright/test';

import { TokenAnswer } from './loginPage';

export const SK_MOCK_SERVICE_DIGESTS_THE_DECODED_USER_CHALLENGE_VERIFIER =
  'SK demo Mock Service: signature.userChallenge is SHA-256 of the Base64URL-decoded userChallengeVerifier, ' +
  'while SK RP API docs (callback_urls: "as is, without Base64URL decoding") and smart-id-java-client 3.2 hash it as is, ' +
  'so the backend rejects every Web2App login the Mock Service completes with smart.id.validation.failed';

const rejectedForTheMockServiceDeviation = (answer: TokenAnswer): boolean =>
  !answer.loggedIn && answer.errorCode === 'smart.id.validation.failed';

export function expectSmartIdLoginCompletedUnlessTheMockServiceRejectsIt(
  answer: TokenAnswer,
): void {
  test.fail(
    rejectedForTheMockServiceDeviation(answer),
    SK_MOCK_SERVICE_DIGESTS_THE_DECODED_USER_CHALLENGE_VERIFIER,
  );
  expect(answer).toEqual({ loggedIn: true });
}
