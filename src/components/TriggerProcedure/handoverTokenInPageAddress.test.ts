import fs from 'fs';
import path from 'path';
import { HANDOVER_TOKEN_STORAGE_KEY } from './handoverTokenStorage';

const PAGE_TEMPLATE = path.join(__dirname, '../../../public/index.html');

const firstScriptOfHead = (): string => {
  const page = new DOMParser().parseFromString(fs.readFileSync(PAGE_TEMPLATE, 'utf8'), 'text/html');
  return page.head.querySelector('script')?.text ?? '';
};

const loadPageAt = (address: string) => {
  window.history.replaceState(null, '', address);
  const script = document.createElement('script');
  script.text = firstScriptOfHead();
  document.head.appendChild(script);
  script.remove();
};

const currentAddress = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

describe('the first script of the page', () => {
  afterEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('moves the handover token out of the address of the handover page and into the session', () => {
    loadPageAt(
      '/trigger-procedure?provider=COOP_PANK&handoverToken=eyJhbGci.eyJzdWIi.c2ln&procedure=account#top',
    );

    expect(currentAddress()).toBe('/trigger-procedure?provider=COOP_PANK&procedure=account#top');
    expect(sessionStorage.getItem(HANDOVER_TOKEN_STORAGE_KEY)).toBe('eyJhbGci.eyJzdWIi.c2ln');
  });

  it('removes the question mark when the token was the only parameter', () => {
    loadPageAt('/trigger-procedure?handoverToken=eyJhbGci.eyJzdWIi.c2ln');

    expect(currentAddress()).toBe('/trigger-procedure');
    expect(sessionStorage.getItem(HANDOVER_TOKEN_STORAGE_KEY)).toBe('eyJhbGci.eyJzdWIi.c2ln');
  });

  it('keeps the parameters that come after a leading token', () => {
    loadPageAt('/trigger-procedure?handoverToken=a%2Bb&provider=COOP_PANK');

    expect(currentAddress()).toBe('/trigger-procedure?provider=COOP_PANK');
    expect(sessionStorage.getItem(HANDOVER_TOKEN_STORAGE_KEY)).toBe('a+b');
  });

  it('leaves the address of every other page alone', () => {
    loadPageAt('/account?handoverToken=eyJhbGci.eyJzdWIi.c2ln');

    expect(currentAddress()).toBe('/account?handoverToken=eyJhbGci.eyJzdWIi.c2ln');
    expect(sessionStorage.getItem(HANDOVER_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('keeps the token in the address when the session cannot hold it, so the login still works', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    loadPageAt('/trigger-procedure?provider=COOP_PANK&handoverToken=eyJhbGci.eyJzdWIi.c2ln');

    expect(currentAddress()).toBe(
      '/trigger-procedure?provider=COOP_PANK&handoverToken=eyJhbGci.eyJzdWIi.c2ln',
    );
  });
});
