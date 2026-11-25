const VISIT_KEY = 'tuleva.visit';
const IDLE_MS = 30 * 60 * 1000;

export type Device = 'mobile' | 'tablet' | 'desktop';

export type Visit = { visitId: string; device: Device };

export const deviceType = (width: number, coarsePointer: boolean): Device => {
  if (width < 768) {
    return 'mobile';
  }
  return coarsePointer && width < 1200 ? 'tablet' : 'desktop';
};

const newVisitId = (): string =>
  typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const hasCoarsePointer = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

// One id per visit: kept while the tab is used, renewed after 30 minutes without events,
// so a person's events can be read in order without joining on timestamps.
export const currentVisit = (now: number = Date.now()): Visit => {
  let visitId = newVisitId();
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(VISIT_KEY) || 'null');
    if (saved && typeof saved.id === 'string' && now - Number(saved.lastSeen) < IDLE_MS) {
      visitId = saved.id;
    }
    window.sessionStorage.setItem(VISIT_KEY, JSON.stringify({ id: visitId, lastSeen: now }));
  } catch (error) {
    // storage can be unavailable (private mode); the event still gets a fresh id
  }
  return { visitId, device: deviceType(window.innerWidth, hasCoarsePointer()) };
};

// Without analytics consent nothing may be kept in the browser, so a logged-out person's events
// get an id for this page load only: enough to count, not to follow them.
const pageLoadVisitId = newVisitId();

const hasAnalyticsConsent = (): boolean =>
  /(^|; )cookieyes-consent=[^;]*analytics:yes/.test(document.cookie);

export const anonymousVisit = (now: number = Date.now()): Visit =>
  hasAnalyticsConsent()
    ? currentVisit(now)
    : { visitId: pageLoadVisitId, device: deviceType(window.innerWidth, hasCoarsePointer()) };
