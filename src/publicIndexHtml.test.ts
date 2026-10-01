import { readFileSync } from 'fs';
import { join } from 'path';

const indexHtml = readFileSync(join(__dirname, '..', 'public', 'index.html'), 'utf8');

const runAddressCleanup = () => {
  const [, script] = /<script>([\s\S]*?)<\/script>/.exec(indexHtml) ?? [];
  // eslint-disable-next-line no-new-func
  new Function(script)();
};

const openAddress = (address: string) => window.history.replaceState(null, '', address);

const currentAddress = () => `${window.location.pathname}${window.location.search}`;

describe('the html every page is served from', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterAll(() => openAddress('/'));

  it('keeps the app out of search indexes', () => {
    expect(indexHtml).toContain('<meta name="robots" content="noindex, nofollow" />');
  });

  it('cleans the address up before the Meta Pixel reports it', () => {
    expect(indexHtml.indexOf('<script>')).toBeLessThan(indexHtml.indexOf("fbq('init'"));
  });

  it('moves the partner handover token out of the address', () => {
    openAddress('/trigger-procedure?handoverToken=a.b.c&provider=COOP_PANK');

    runAddressCleanup();

    expect(currentAddress()).toBe('/trigger-procedure?provider=COOP_PANK');
    expect(sessionStorage.getItem('handoverToken')).toBe('a.b.c');
  });

  it('moves the Smart-ID callback parameters out of the address', () => {
    openAddress(
      '/login/smart-id/callback?value=a1B2&sessionSecretDigest=c3D4&userChallengeVerifier=e5F6',
    );

    runAddressCleanup();

    expect(currentAddress()).toBe('/login/smart-id/callback');
    expect(JSON.parse(sessionStorage.getItem('smartIdCallback') ?? 'null')).toEqual({
      value: 'a1B2',
      sessionSecretDigest: 'c3D4',
      userChallengeVerifier: 'e5F6',
    });
  });

  it('leaves the address of any other page alone', () => {
    openAddress('/account?value=42');

    runAddressCleanup();

    expect(currentAddress()).toBe('/account?value=42');
    expect(sessionStorage.length).toBe(0);
  });
});
