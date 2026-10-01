import { HANDOVER_TOKEN_STORAGE_KEY, storedHandoverToken } from './handoverTokenStorage';

describe('storedHandoverToken', () => {
  afterEach(() => {
    delete window.handoverToken;
    window.sessionStorage.clear();
  });

  it('prefers the token of the current page over one left in session storage by an earlier handover', () => {
    window.sessionStorage.setItem(HANDOVER_TOKEN_STORAGE_KEY, 'an-earlier-token');
    window.handoverToken = 'the-current-token';

    expect(storedHandoverToken()).toBe('the-current-token');
  });

  it('reads the token from session storage when the page kept none of its own', () => {
    window.sessionStorage.setItem(HANDOVER_TOKEN_STORAGE_KEY, 'a-stored-token');

    expect(storedHandoverToken()).toBe('a-stored-token');
  });
});
