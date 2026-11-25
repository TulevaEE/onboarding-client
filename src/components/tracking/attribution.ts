import { redactPii } from './piiPatterns';

const STORAGE_KEY = 'tuleva.attribution';
// Set on tuleva.ee for the whole .tuleva.ee domain, so a campaign that lands on the website is
// still known when the person logs in here.
export const ATTRIBUTION_COOKIE = 'tuleva_attribution';
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
// Hosts a person passes through on the way back to us: not where they came from.
const TRANSIT_HOSTS = /(^|\.)(tuleva\.ee|montonio\.com|smart-id\.com|sk\.ee|eid\.ee)$/i;

export type Touch = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  clickId: 'gclid' | 'fbclid' | null;
  referrerHost: string | null;
  landingPath: string;
  at: string;
};

export type Attribution = { first: Touch; last: Touch };

const clip = (value: string | null): string | null => (value === null ? null : value.slice(0, 100));

const externalReferrerHost = (referrer: string): string | null => {
  try {
    const host = referrer ? new URL(referrer).hostname : '';
    return host && !TRANSIT_HOSTS.test(host) ? host : null;
  } catch (error) {
    return null;
  }
};

export const touchFromPage = (url: URL, referrer: string, now: Date): Touch | null => {
  const utm = (name: string) => clip(url.searchParams.get(`utm_${name}`));
  const source = utm('source');
  if (source === 'e2e') {
    return null;
  }
  let clickId: Touch['clickId'] = null;
  if (url.searchParams.has('gclid')) {
    clickId = 'gclid';
  } else if (url.searchParams.has('fbclid')) {
    clickId = 'fbclid';
  }
  const referrerHost = externalReferrerHost(referrer);
  if (!source && !utm('medium') && !utm('campaign') && !clickId && !referrerHost) {
    return null;
  }
  return {
    source,
    medium: utm('medium'),
    campaign: utm('campaign'),
    content: utm('content'),
    term: utm('term'),
    clickId,
    referrerHost,
    landingPath: redactPii(url.pathname),
    at: now.toISOString(),
  };
};

const isTouch = (value: unknown): value is Touch =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Touch).at === 'string' &&
  typeof (value as Touch).landingPath === 'string';

const parse = (json: string | null | undefined): Attribution | null => {
  try {
    const value = JSON.parse(json || 'null');
    return value && isTouch(value.first) && isTouch(value.last) ? value : null;
  } catch (error) {
    return null;
  }
};

const isFresh = (touch: Touch, now: Date): boolean =>
  now.getTime() - Date.parse(touch.at) < MAX_AGE_MS;

const fresh = (attribution: Attribution | null, now: Date): Attribution | null => {
  if (!attribution || !isFresh(attribution.last, now)) {
    return null;
  }
  return isFresh(attribution.first, now)
    ? attribution
    : { first: attribution.last, last: attribution.last };
};

const readCookie = (): Attribution | null => {
  const entry = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${ATTRIBUTION_COOKIE}=`));
  if (!entry) {
    return null;
  }
  try {
    return parse(decodeURIComponent(entry.slice(ATTRIBUTION_COOKIE.length + 1)));
  } catch (error) {
    return null;
  }
};

// Shared with tuleva.ee both ways: a campaign that lands on the website is known here at login,
// and one that lands here (email links often do) is known on the website.
const writeCookie = (attribution: Attribution): void => {
  const onTulevaDomain = /(^|\.)tuleva\.ee$/.test(window.location.hostname);
  const domain = onTulevaDomain ? '; domain=.tuleva.ee' : '';
  const maxAge = Math.round(MAX_AGE_MS / 1000);
  document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(
    JSON.stringify(attribution),
  )}; max-age=${maxAge}; path=/; SameSite=Lax${domain}${onTulevaDomain ? '; Secure' : ''}`;
};

const readStored = (): Attribution | null => {
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    return null;
  }
};

// First touch: the earliest campaign or outside site within 90 days. Last touch: the latest.
export const captureAttribution = (now: Date = new Date()): void => {
  try {
    const stored = fresh(readStored(), now);
    const fromWebsite = fresh(readCookie(), now);
    const page = touchFromPage(new URL(window.location.href), document.referrer, now);
    const touches = [stored?.first, stored?.last, fromWebsite?.first, fromWebsite?.last, page]
      .filter(isTouch)
      .sort((a, b) => a.at.localeCompare(b.at));
    if (touches.length === 0) {
      return;
    }
    const attribution: Attribution = { first: touches[0], last: touches[touches.length - 1] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    writeCookie(attribution);
  } catch (error) {
    // attribution is best effort and must never stop the app
  }
};

export const storedAttribution = (now: Date = new Date()): Attribution | null =>
  fresh(readStored(), now);
