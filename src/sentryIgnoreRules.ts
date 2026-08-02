// In-app browsers (Instagram, Android WebView) and analytics beacons inject their own
// scripts into our pages. Their failures are reported with our URL as the culprit even
// though the code is not ours and cannot be fixed from this repository.
export const THIRD_PARTY_ERROR_MESSAGES: RegExp[] = [
  /window\.webkit\.messageHandlers/,
  /Error invoking postMessage/,
  /Identifier 'nativeIframe' has already been declared/,
  /zp_token is not defined/,
];

export const THIRD_PARTY_SCRIPT_URLS: RegExp[] = [/beacon\.min\.js/];
