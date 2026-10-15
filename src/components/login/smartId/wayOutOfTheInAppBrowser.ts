export type PageAddress = { host: string; pathAndQuery: string };

export type WayOutOfTheInAppBrowser = {
  opensWith: 'link' | 'window' | 'clipboard';
  addressOf: (page: PageAddress) => string;
};

const IN_APP_BROWSER_USER_AGENT_TOKENS = [
  'FBAN/',
  'FBAV/',
  'FB_IAB/',
  'Instagram',
  'Barcelona',
  'GSA/',
  'LinkedInApp',
  'musical_ly',
  'BytedanceWebview',
];

const isInAppBrowser = (userAgent: string): boolean =>
  IN_APP_BROWSER_USER_AGENT_TOKENS.some((token) => userAgent.includes(token));

const httpsAddressOf = ({ host, pathAndQuery }: PageAddress) => `https://${host}${pathAndQuery}`;

const safariAddressOf = ({ host, pathAndQuery }: PageAddress) =>
  `x-safari-https://${host}${pathAndQuery}`;

const androidIntentTo = (page: PageAddress) =>
  [
    `intent://${page.host}${page.pathAndQuery}#Intent`,
    'scheme=https',
    'action=android.intent.action.VIEW',
    'category=android.intent.category.BROWSABLE',
    `S.browser_fallback_url=${encodeURIComponent(httpsAddressOf(page))}`,
    'end',
  ].join(';');

const instagramExternalBrowserTo = (page: PageAddress) =>
  `instagram://extbrowser/?url=${encodeURIComponent(httpsAddressOf(page))}`;

const isMessengerOnAnIphone = (userAgent: string) => userAgent.includes('FBAN/MessengerForiOS');

const followsLinksToSafari = (userAgent: string) =>
  isMessengerOnAnIphone(userAgent) || userAgent.includes('GSA/');

const opensSafariOnlyFromANewWindow = (userAgent: string) =>
  userAgent.includes('Barcelona') || userAgent.includes('FBAN/') || userAgent.includes('FBAV/');

export function wayOutOfTheInAppBrowser(userAgent: string): WayOutOfTheInAppBrowser | null {
  if (!isInAppBrowser(userAgent)) {
    return null;
  }
  if (userAgent.includes('Android')) {
    return { opensWith: 'link', addressOf: androidIntentTo };
  }
  if (userAgent.includes('Instagram')) {
    return { opensWith: 'link', addressOf: instagramExternalBrowserTo };
  }
  if (followsLinksToSafari(userAgent)) {
    return { opensWith: 'link', addressOf: safariAddressOf };
  }
  if (opensSafariOnlyFromANewWindow(userAgent)) {
    return { opensWith: 'window', addressOf: safariAddressOf };
  }
  return { opensWith: 'clipboard', addressOf: httpsAddressOf };
}
