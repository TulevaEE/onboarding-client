import { THIRD_PARTY_ERROR_MESSAGES, THIRD_PARTY_SCRIPT_URLS } from './sentryIgnoreRules';

const matches = (patterns: RegExp[], value: string) =>
  patterns.some((pattern) => pattern.test(value));

describe('sentry ignore rules', () => {
  it.each([
    "TypeError: undefined is not an object (evaluating 'window.webkit.messageHandlers')",
    'Error: Error invoking postMessage: Java object is gone',
    "SyntaxError: Identifier 'nativeIframe' has already been declared",
    'ReferenceError: zp_token is not defined',
  ])('drops injected in-app browser error: %s', (message) => {
    expect(matches(THIRD_PARTY_ERROR_MESSAGES, message)).toBe(true);
  });

  it.each([
    'TypeError: can\'t access property "type", e.role is undefined',
    'TypeError: can\'t access property "find", c.fundPensions is undefined',
    'TypeError: a.filter is not a function',
    "TypeError: undefined is not an object (evaluating 'e.body.errors')",
    'AxiosError: Network Error',
    'RangeError: Maximum call stack size exceeded.',
  ])('keeps application error: %s', (message) => {
    expect(matches(THIRD_PARTY_ERROR_MESSAGES, message)).toBe(false);
  });

  it('drops the third-party analytics beacon', () => {
    expect(
      matches(
        THIRD_PARTY_SCRIPT_URLS,
        'https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496',
      ),
    ).toBe(true);
  });

  it('keeps our own bundle', () => {
    expect(
      matches(THIRD_PARTY_SCRIPT_URLS, 'https://pension.tuleva.ee/static/js/main.8f3a91c2.js'),
    ).toBe(false);
  });
});
