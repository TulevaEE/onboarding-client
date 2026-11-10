import { finish, init, EXTERNAL_AUTHENTICATOR_PROVIDER } from './utils';
import { getPaymentLink } from '../common/api';
import { getAuthentication, isLoggedInThroughPartner } from '../common/authenticationManager';
import { isSessionStorageBlocked } from '../common/siteStorage';
import { blockSiteStorage } from '../../test/siteStorage';
import { initializeConfiguration } from '../config/config';

jest.mock('../common/api');
jest.mock('../common/authenticationManager');

describe('finish', () => {
  beforeEach(() => {
    initializeConfiguration();
    sessionStorage.clear();
    sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_PROVIDER, 'COOP_PANK');
    (getAuthentication as jest.Mock).mockReturnValue({ isAuthenticated: () => true });
    (isLoggedInThroughPartner as jest.Mock).mockReturnValue(true);
    delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  });

  it('refuses to finish for someone who has since logged in another way', async () => {
    (isLoggedInThroughPartner as jest.Mock).mockReturnValue(false);
    (getPaymentLink as jest.Mock).mockClear();

    await expect(finish('newPayment', undefined, '38812121215')).rejects.toThrow();
    expect(getPaymentLink).not.toHaveBeenCalled();
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
      /partner session/,
    );
  });

  describe('when the person came from the internet bank', () => {
    const originalLocation = window.location;
    const pageLocation = { href: 'http://localhost/partner/3rd-pillar-flow/success' };

    beforeEach(() => {
      pageLocation.href = 'http://localhost/partner/3rd-pillar-flow/success';
      Object.defineProperty(window, 'location', {
        value: pageLocation,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it("opens the payment form at Coop's own internet bank address", async () => {
      (getPaymentLink as jest.Mock).mockResolvedValue({
        type: 'PREFILLED',
        url: 'i/payments/new?bname=Tuleva',
      });

      await finish('newPayment', undefined, '38812121215');

      expect(pageLocation.href).toBe('https://i.cooppank.ee/i/payments/new?bname=Tuleva');
    });

    it('ignores a redirect address a page link left in the session', async () => {
      sessionStorage.setItem('EXTERNAL_AUTHENTICATOR_REDIRECT_URI', 'https://phishing.example/');
      (getPaymentLink as jest.Mock).mockResolvedValue({
        type: 'PREFILLED',
        url: 'i/standing-orders/new?bname=Tuleva',
      });

      await finish('newRecurringPayment', undefined, '38812121215');

      expect(pageLocation.href).toBe('https://i.cooppank.ee/i/standing-orders/new?bname=Tuleva');
    });

    it.each(['https://phishing.example/i/payments/new', '//phishing.example/i/payments/new'])(
      "refuses a payment link that leads away from Coop's internet bank: %s",
      async (url) => {
        (getPaymentLink as jest.Mock).mockResolvedValue({ type: 'PREFILLED', url });

        await expect(finish('newPayment', undefined, '38812121215')).rejects.toThrow();
        expect(pageLocation.href).toBe('http://localhost/partner/3rd-pillar-flow/success');
      },
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
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('keeps nothing for the session before the handover token is exchanged', () => {
    init({
      provider: 'COOP_PANK',
      procedure: 'account',
      handoverToken: 'aHandoverToken',
    });

    expect(sessionStorage.length).toBe(0);
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
        }),
      ).toEqual({
        provider: 'COOP_PANK',
        procedure: 'account',
        handoverToken: 'aHandoverToken',
        path: '/account',
      });
    });
  });
});
