const GIFT_TOKEN_IN_ADDRESS = /(\/kingitus\/|\/v1\/gift-links\/)[^/?#]+/g;
const GIFT_TOKEN_PLACEHOLDER = ':token';

export const isGiftPage = (): boolean => /^\/kingitus(\/|$)/.test(window.location.pathname);

export const withoutGiftToken = (address: string): string =>
  address.replace(GIFT_TOKEN_IN_ADDRESS, `$1${GIFT_TOKEN_PLACEHOLDER}`);
