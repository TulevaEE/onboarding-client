import { Event } from '@sentry/browser';

const OWN_BUNDLE_PATH = '/static/js/';

export function isFirstPartyEvent(event: Event): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames;

  if (!frames?.length) {
    return true;
  }

  return frames.some((frame) => frame.filename?.includes(OWN_BUNDLE_PATH));
}
