import { Breadcrumb, Event } from '@sentry/browser';

const OWN_BUNDLE_PATH = '/static/js/';
const GIFT_TOKEN_IN_ADDRESS = /(\/kingitus\/|\/v1\/gift-links\/)[^/?#]+/g;
const TOKEN_PLACEHOLDER = ':token';
const BREADCRUMB_ADDRESS_FIELDS = ['url', 'from', 'to'];

export function isFirstPartyEvent(event: Event): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames;

  if (!frames?.length) {
    return true;
  }

  return frames.some((frame) => frame.filename?.includes(OWN_BUNDLE_PATH));
}

export const withoutGiftToken = (address: string): string =>
  address.replace(GIFT_TOKEN_IN_ADDRESS, `$1${TOKEN_PLACEHOLDER}`);

export function beforeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (!breadcrumb.data) {
    return breadcrumb;
  }

  const data = { ...breadcrumb.data };
  BREADCRUMB_ADDRESS_FIELDS.forEach((field) => {
    if (typeof data[field] === 'string') {
      data[field] = withoutGiftToken(data[field]);
    }
  });

  return { ...breadcrumb, data };
}

export function withoutGiftTokens(event: Event): Event {
  const scrubbed: Event = { ...event, breadcrumbs: event.breadcrumbs?.map(beforeBreadcrumb) };

  if (!event.request) {
    return scrubbed;
  }

  const { url, headers } = event.request;
  return {
    ...scrubbed,
    request: {
      ...event.request,
      url: url === undefined ? undefined : withoutGiftToken(url),
      headers: headers?.Referer
        ? { ...headers, Referer: withoutGiftToken(headers.Referer) }
        : headers,
    },
  };
}
