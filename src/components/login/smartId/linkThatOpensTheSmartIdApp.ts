import { inSamsungInternet } from '../../common/browserFamily';

const LIVE_SMART_ID_APP_LINK_HOST = 'smart-id.com';
const LIVE_SMART_ID_APP_ON_ANDROID = 'com.smart_id';

const intentForTheSmartIdApp = (web2AppLink: string, link: URL) =>
  `intent://${link.host}${link.pathname}${
    link.search
  }#Intent;scheme=https;package=${LIVE_SMART_ID_APP_ON_ANDROID};S.browser_fallback_url=${encodeURIComponent(
    web2AppLink,
  )};end`;

export function linkThatOpensTheSmartIdApp(
  web2AppLink: string,
  userAgent: string = navigator.userAgent,
): string {
  if (!inSamsungInternet(userAgent)) {
    return web2AppLink;
  }
  const link = new URL(web2AppLink);
  if (link.protocol !== 'https:' || link.host !== LIVE_SMART_ID_APP_LINK_HOST) {
    return web2AppLink;
  }
  return intentForTheSmartIdApp(web2AppLink, link);
}
