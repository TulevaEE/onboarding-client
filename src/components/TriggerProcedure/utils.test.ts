import {
  finish,
  init,
  EXTERNAL_AUTHENTICATOR_PROVIDER,
  EXTERNAL_AUTHENTICATOR_REDIRECT_URI,
} from './utils';
import { getPaymentLink } from '../common/api';
import { getAuthentication } from '../common/authenticationManager';
import { isSessionStorageBlocked } from '../common/siteStorage';
import { blockSiteStorage } from '../../test/siteStorage';

jest.mock('../common/api');
jest.mock('../common/authenticationManager');

describe('finish', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_PROVIDER, 'COOP_PANK');
    sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_REDIRECT_URI, 'https://partner.example/');
    (getAuthentication as jest.Mock).mockReturnValue({ isAuthenticated: () => true });
    delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  });

  it('throws when partner-flow payment link is missing url', async () => {
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {
      postMessage: jest.fn(),
    };
    (getPaymentLink as jest.Mock).mockResolvedValue({
      type: 'PREFILLED',
      recipientName: '',
      recipientIban: '',
      description: '',
    });

    await expect(finish('newRecurringPayment', undefined, '38812121215')).rejects.toThrow(
      /partner flow.*missing url/,
    );
  });

  it('throws when COOP_WEB redirect payment link is missing url', async () => {
    (getPaymentLink as jest.Mock).mockResolvedValue({
      type: 'PREFILLED',
      recipientName: '',
      recipientIban: '',
      description: '',
    });

    await expect(finish('newSinglePayment', undefined, '38812121215')).rejects.toThrow(
      /COOP_WEB.*missing url/,
    );
  });

  it('posts an error message to the partner app even when not authenticated', async () => {
    const postMessage = jest.fn();
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = { postMessage };
    (getAuthentication as jest.Mock).mockReturnValue({ isAuthenticated: () => false });

    await finish(undefined, 'handover failed');

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      errorMessage: 'handover failed',
      time: expect.any(String),
    });
  });

  it('rejects when personal code is missing instead of failing silently', async () => {
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {
      postMessage: jest.fn(),
    };
    (getPaymentLink as jest.Mock).mockClear();

    await expect(finish('newRecurringPayment', undefined, undefined)).rejects.toThrow(
      /personal code/,
    );
    expect(getPaymentLink).not.toHaveBeenCalled();
  });

  it('rejects when provider is missing instead of failing silently', async () => {
    sessionStorage.removeItem(EXTERNAL_AUTHENTICATOR_PROVIDER);
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = {
      postMessage: jest.fn(),
    };

    await expect(finish('newRecurringPayment', undefined, '38812121215')).rejects.toThrow(
      /provider/,
    );
  });

  describe('when the browser blocks session storage', () => {
    let unblockSiteStorage: () => void;

    beforeEach(() => {
      unblockSiteStorage = blockSiteStorage();
      expect(isSessionStorageBlocked()).toBe(true);
    });

    afterEach(() => unblockSiteStorage());

    it('still posts the error message to the partner app', async () => {
      const postMessage = jest.fn();
      (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = { postMessage };

      await finish(undefined, 'handover failed');

      expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
        errorMessage: 'handover failed',
        time: expect.any(String),
      });
    });
  });
});

describe('init', () => {
  afterEach(() => sessionStorage.clear());

  it('keeps the provider and the redirect address for the session', () => {
    init({
      provider: 'COOP_PANK',
      procedure: 'account',
      handoverToken: 'aHandoverToken',
      redirectUri: 'https://partner.example/',
    });

    expect(sessionStorage.getItem(EXTERNAL_AUTHENTICATOR_PROVIDER)).toBe('COOP_PANK');
    expect(sessionStorage.getItem(EXTERNAL_AUTHENTICATOR_REDIRECT_URI)).toBe(
      'https://partner.example/',
    );
  });

  describe('when the browser blocks session storage', () => {
    let unblockSiteStorage: () => void;

    beforeEach(() => {
      unblockSiteStorage = blockSiteStorage();
      expect(isSessionStorageBlocked()).toBe(true);
    });

    afterEach(() => unblockSiteStorage());

    it('still starts the procedure', () => {
      expect(
        init({
          provider: 'COOP_PANK',
          procedure: 'account',
          handoverToken: 'aHandoverToken',
          redirectUri: 'https://partner.example/',
        }),
      ).toEqual({
        provider: 'COOP_PANK',
        procedure: 'account',
        handoverToken: 'aHandoverToken',
        redirectUri: 'https://partner.example/',
        path: '/account',
      });
    });
  });
});
