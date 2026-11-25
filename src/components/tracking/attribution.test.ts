import {
  ATTRIBUTION_COOKIE,
  captureAttribution,
  storedAttribution,
  touchFromPage,
} from './attribution';

const at = (iso: string) => new Date(iso);

const visit = (path: string, referrer = '') => {
  window.history.pushState({}, '', path);
  Object.defineProperty(document, 'referrer', { value: referrer, configurable: true });
};

describe('touchFromPage', () => {
  it('reads UTM tags, the ad click id and the landing path', () => {
    const touch = touchFromPage(
      new URL(
        'https://pension.tuleva.ee/login?utm_source=Tuleva&utm_medium=email&utm_campaign=nov&fbclid=x',
      ),
      '',
      at('2026-11-25T10:00:00Z'),
    );

    expect(touch).toEqual({
      source: 'Tuleva',
      medium: 'email',
      campaign: 'nov',
      content: null,
      term: null,
      clickId: 'fbclid',
      referrerHost: null,
      landingPath: '/login',
      at: '2026-11-25T10:00:00.000Z',
    });
  });

  it('counts an outside site as the source, but not our own sites or the payment and login pages', () => {
    const page = new URL('https://tuleva.ee/');
    const now = at('2026-11-25T10:00:00Z');

    expect(touchFromPage(page, 'https://www.google.com/', now)?.referrerHost).toBe(
      'www.google.com',
    );
    expect(touchFromPage(page, 'https://pension.tuleva.ee/account', now)).toBeNull();
    expect(touchFromPage(page, 'https://paymentsv2.montonio.com/x', now)).toBeNull();
    expect(touchFromPage(page, '', now)).toBeNull();
  });

  it('ignores the end-to-end tests', () => {
    expect(
      touchFromPage(
        new URL('https://pension.tuleva.ee/?utm_source=e2e'),
        '',
        at('2026-11-25T10:00:00Z'),
      ),
    ).toBeNull();
  });
});

describe('captureAttribution', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = `${ATTRIBUTION_COOKIE}=; max-age=0; path=/`;
  });

  it('keeps the first campaign and updates the last one', () => {
    visit('/login?utm_source=meta&utm_medium=paid_social&utm_campaign=lapsele');
    captureAttribution(at('2026-11-01T10:00:00Z'));
    visit('/account?utm_source=Tuleva&utm_medium=email&utm_campaign=nov');
    captureAttribution(at('2026-11-20T10:00:00Z'));

    const attribution = storedAttribution(at('2026-11-21T10:00:00Z'));
    expect(attribution?.first.campaign).toBe('lapsele');
    expect(attribution?.last.campaign).toBe('nov');
  });

  it('shares the attribution with tuleva.ee in a cookie, and reads the one tuleva.ee set', () => {
    const fromWebsite = {
      source: 'google',
      medium: 'organic',
      campaign: null,
      content: null,
      term: null,
      clickId: null,
      referrerHost: 'www.google.com',
      landingPath: '/iii-sammas/',
      at: '2026-11-10T10:00:00.000Z',
    };
    document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(
      JSON.stringify({ first: fromWebsite, last: fromWebsite }),
    )}; path=/`;
    visit('/login?utm_source=Tuleva&utm_medium=email');

    captureAttribution(at('2026-11-12T10:00:00Z'));

    const attribution = storedAttribution(at('2026-11-12T10:00:00Z'));
    expect(attribution?.first.landingPath).toBe('/iii-sammas/');
    expect(attribution?.last.medium).toBe('email');
    expect(decodeURIComponent(document.cookie)).toContain('"medium":"email"');
  });

  it('forgets touches older than 90 days', () => {
    visit('/login?utm_source=meta');
    captureAttribution(at('2026-01-01T10:00:00Z'));

    expect(storedAttribution(at('2026-11-25T10:00:00Z'))).toBeNull();
  });
});
