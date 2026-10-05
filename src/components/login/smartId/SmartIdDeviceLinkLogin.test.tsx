import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import { SmartIdDeviceLinkLogin } from './SmartIdDeviceLinkLogin';
import { automaticRenewalAllowance, AutomaticRenewalAllowance } from './automaticRenewalAllowance';
import { getSmartIdQrCodeLink } from '../../common/api';
import { expectStackedFullWidth } from '../../../test/expectStackedFullWidth';
import { expectFullWidthCancel } from '../../../test/expectFullWidthCancel';
import { expectNoCardOfItsOwn } from '../../../test/expectNoCardOfItsOwn';

jest.unmock('react-intl');
jest.mock('../../common/api');
jest.mock('qrcode.react', () => {
  const { QRCodeSVG } = jest.requireActual('qrcode.react');
  return {
    QRCodeSVG: ({ value, ...props }: { value: string }) => (
      <QRCodeSVG value={value} data-value={value} {...props} />
    ),
  };
});

const mockGetSmartIdQrCodeLink = getSmartIdQrCodeLink as jest.MockedFunction<
  typeof getSmartIdQrCodeLink
>;

describe('Smart-ID device link login', () => {
  const web2AppLink = 'https://smart-id.com/device-link/?deviceLinkType=Web2App&sessionType=auth';
  const qrCodeLinkAfter = (elapsedSeconds: number) =>
    `https://smart-id.com/device-link/?deviceLinkType=QR&elapsedSeconds=${elapsedSeconds}`;
  const sessionTokenOfSmartIdLength = 'T'.repeat(24);
  const hmacSha256InUnpaddedBase64Url = 'A'.repeat(43);
  const qrCodeLinkAsTheBackendBuildsIt = [
    qrCodeLinkAfter(59),
    `sessionToken=${sessionTokenOfSmartIdLength}`,
    'sessionType=auth',
    'version=1.0',
    'lang=est',
    `authCode=${hmacSha256InUnpaddedBase64Url}`,
  ].join('&');
  const desktopUserAgent = navigator.userAgent;
  const tabletUserAgent = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
  const phoneUserAgent =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
  const onCancel = jest.fn();
  const onSmartIdLoginStart = jest.fn();
  const onExpire = jest.fn();

  const setUserAgent = (userAgent: string) =>
    Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });

  let renewals: AutomaticRenewalAllowance;

  const renderDeviceLinkLogin = ({
    rememberMe = false,
    qrCodeRequested = false,
    language = 'en',
  }: { rememberMe?: boolean; qrCodeRequested?: boolean; language?: 'en' | 'et' } = {}) =>
    render(
      <IntlProvider locale={language} messages={translations[language]}>
        <SmartIdDeviceLinkLogin
          web2AppLink={web2AppLink}
          rememberMe={rememberMe}
          qrCodeRequested={qrCodeRequested}
          onCancel={onCancel}
          onSmartIdLoginStart={onSmartIdLoginStart}
          onExpire={onExpire}
          automaticRenewals={renewals}
        />
      </IntlProvider>,
    );

  const setPageVisibility = (visibility: 'visible' | 'hidden') => {
    Object.defineProperty(document, 'visibilityState', { value: visibility, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  };

  const outliveTheSession = () =>
    act(async () => {
      jest.advanceTimersByTime(60000);
    });

  const flushPendingRequests = () => act(async () => undefined);
  const advanceOneSecond = () =>
    act(async () => {
      jest.advanceTimersByTime(1000);
    });

  beforeEach(() => {
    renewals = automaticRenewalAllowance();
    setPageVisibility('visible');
    sessionStorage.clear();
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetSmartIdQrCodeLink.mockResolvedValue({ deviceLink: qrCodeLinkAfter(0) });
  });

  afterEach(() => {
    jest.useRealTimers();
    setUserAgent(desktopUserAgent);
  });

  it.each([
    ['en', 'Scan with the Smart\u2011ID app'],
    ['et', 'Skanni Smart\u2011ID rakendusega'],
  ] as const)(
    'asks in %s to scan the QR code with the Smart-ID app',
    async (language, instruction) => {
      renderDeviceLinkLogin({ language });
      await flushPendingRequests();

      expect(screen.getByText(instruction)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: instruction })).toHaveAttribute(
        'data-value',
        qrCodeLinkAfter(0),
      );
    },
  );

  it('shows the QR code with nothing around it but the instruction and the way out', async () => {
    const { container } = renderDeviceLinkLogin();
    await flushPendingRequests();

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(container).toHaveTextContent(/^Scan with the Smart.ID appCancel$/);
  });

  it('moves the focus to the instruction when the QR code view opens, so a screen reader reads it', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();

    expect(screen.getByText(/^Scan with the Smart.ID app$/)).toHaveFocus();
  });

  it('moves the focus to the news that the QR code expired', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();
    setPageVisibility('hidden');

    await outliveTheSession();

    expect(screen.getByText('The QR code expired.')).toHaveFocus();
  });

  it('draws no card of its own around the QR code, so it can sit inside the login card', async () => {
    const { container } = renderDeviceLinkLogin();
    await flushPendingRequests();

    expectNoCardOfItsOwn(container);
  });

  it('draws no card of its own around the expired QR code', async () => {
    const { container } = renderDeviceLinkLogin();
    await flushPendingRequests();
    setPageVisibility('hidden');
    await outliveTheSession();

    expect(screen.getByText('The QR code expired.')).toBeInTheDocument();
    expectNoCardOfItsOwn(container);
  });

  it('draws no card of its own around the wait for the Smart-ID app on a phone', async () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
    const { container } = renderDeviceLinkLogin();
    await flushPendingRequests();

    expectNoCardOfItsOwn(container);
  });

  it('draws the QR code of a full device link at least 6 px per module, but never wider than the screen', async () => {
    mockGetSmartIdQrCodeLink.mockResolvedValue({ deviceLink: qrCodeLinkAsTheBackendBuildsIt });
    renderDeviceLinkLogin();
    await flushPendingRequests();

    const qrCode = screen.getByRole('img');
    const [, , modules] = (qrCode.getAttribute('viewBox') ?? '').split(' ').map(Number);
    expect(Number(qrCode.getAttribute('width')) / modules).toBeGreaterThanOrEqual(6);
    expect(qrCode).toHaveStyle({ maxWidth: '100%' });
  });

  it('draws the QR code of a full device link at 10 px per module on a tablet, but never wider than the screen', async () => {
    setUserAgent(tabletUserAgent);
    mockGetSmartIdQrCodeLink.mockResolvedValue({ deviceLink: qrCodeLinkAsTheBackendBuildsIt });
    renderDeviceLinkLogin();
    await flushPendingRequests();

    const qrCode = screen.getByRole('img');
    const [, , modules] = (qrCode.getAttribute('viewBox') ?? '').split(' ').map(Number);
    expect(Number(qrCode.getAttribute('width')) / modules).toBe(10);
    expect(qrCode).toHaveStyle({ maxWidth: '100%' });
    /* eslint-disable-next-line testing-library/no-node-access */
    expect(qrCode.parentElement).toHaveStyle({ width: '530px', maxWidth: '100%' });
  });

  it('offers a tablet a quiet link under the QR code that opens the Smart-ID app of the same session', async () => {
    setUserAgent(tabletUserAgent);
    const { container } = renderDeviceLinkLogin();
    await flushPendingRequests();

    const appLink = screen.getByRole('link', { name: 'Open the Smart\u2011ID app' });
    expect(appLink).toHaveAttribute('href', web2AppLink);
    expect(appLink).toHaveClass('btn', 'btn-link');
    expect(appLink).not.toHaveClass('btn-primary');
    expect(appLink).toHaveStyle({ minHeight: '44px' });
    expect(container).toHaveTextContent(/^Scan with the Smart.ID appOpen the Smart.ID appCancel$/);
    expect(screen.getByRole('img').compareDocumentPosition(appLink)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('offers a tablet no link into the app of a session whose QR code expired', async () => {
    setUserAgent(tabletUserAgent);
    renderDeviceLinkLogin();
    await flushPendingRequests();
    setPageVisibility('hidden');

    await outliveTheSession();

    expect(screen.getByText('The QR code expired.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a phone the QR code it asked for at 10 px per module, but never wider than the screen', async () => {
    setUserAgent(phoneUserAgent);
    mockGetSmartIdQrCodeLink.mockResolvedValue({ deviceLink: qrCodeLinkAsTheBackendBuildsIt });
    renderDeviceLinkLogin({ qrCodeRequested: true });
    await flushPendingRequests();

    const qrCode = screen.getByRole('img');
    const [, , modules] = (qrCode.getAttribute('viewBox') ?? '').split(' ').map(Number);
    expect(Number(qrCode.getAttribute('width')) / modules).toBe(10);
    /* eslint-disable-next-line testing-library/no-node-access */
    expect(qrCode.parentElement).toHaveStyle({ width: '530px', maxWidth: '100%' });
  });

  it('shows a phone the QR code it asked for with nothing around it but the instruction and the way out', async () => {
    setUserAgent(phoneUserAgent);
    const { container } = renderDeviceLinkLogin({ qrCodeRequested: true });
    await flushPendingRequests();

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(container).toHaveTextContent(/^Scan with the Smart.ID appCancel$/);
  });

  it('holds the place of the QR code at its size while no fresh code is there to show', async () => {
    renderDeviceLinkLogin();
    /* eslint-disable testing-library/no-node-access */
    const placeOfTheQrCode = screen.getByRole('status', { name: 'Loading' }).parentElement;
    expect(placeOfTheQrCode).toHaveStyle({ width: '371px', maxWidth: '100%' });

    await flushPendingRequests();

    expect(screen.getByRole('img').parentElement).toBe(placeOfTheQrCode);
    /* eslint-enable testing-library/no-node-access */
  });

  it('renders a fresh QR code every second', async () => {
    mockGetSmartIdQrCodeLink
      .mockResolvedValueOnce({ deviceLink: qrCodeLinkAfter(0) })
      .mockResolvedValueOnce({ deviceLink: qrCodeLinkAfter(1) })
      .mockResolvedValueOnce({ deviceLink: qrCodeLinkAfter(2) });
    renderDeviceLinkLogin();
    await flushPendingRequests();

    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(0));

    await advanceOneSecond();
    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(1));

    await advanceOneSecond();
    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(2));
    expect(mockGetSmartIdQrCodeLink).toHaveBeenCalledTimes(3);
  });

  it('ignores a QR code request that answers out of order', async () => {
    let answerFirstRequest: (qrCode: { deviceLink: string }) => void = () => undefined;
    mockGetSmartIdQrCodeLink
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            answerFirstRequest = resolve;
          }),
      )
      .mockResolvedValue({ deviceLink: qrCodeLinkAfter(1) });
    renderDeviceLinkLogin();
    await flushPendingRequests();

    await advanceOneSecond();
    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(1));

    await act(async () => {
      answerFirstRequest({ deviceLink: qrCodeLinkAfter(0) });
    });

    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(1));
  });

  it('keeps showing fresh QR codes when every request takes longer than a second', async () => {
    let served = 0;
    mockGetSmartIdQrCodeLink.mockImplementation(
      () =>
        new Promise((resolve) => {
          const elapsedSeconds = served;
          served += 1;
          setTimeout(() => resolve({ deviceLink: qrCodeLinkAfter(elapsedSeconds) }), 1500);
        }),
    );
    renderDeviceLinkLogin();
    await flushPendingRequests();

    await advanceOneSecond();
    await advanceOneSecond();
    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(0));

    await advanceOneSecond();
    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(1));

    await advanceOneSecond();
    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(2));
  });

  it('hides a QR code that has not been refreshed for three seconds', async () => {
    mockGetSmartIdQrCodeLink
      .mockResolvedValueOnce({ deviceLink: qrCodeLinkAfter(0) })
      .mockRejectedValue({ status: 500, body: {} });
    renderDeviceLinkLogin();
    await flushPendingRequests();

    await advanceOneSecond();
    await advanceOneSecond();
    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(0));

    await advanceOneSecond();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('starts a new session by itself when the QR code expires while the page is in view', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();

    await outliveTheSession();

    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK', false);
    expect(screen.queryByText('The QR code expired.')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('starts the new session by itself with the choice to be remembered the expired one had', async () => {
    renderDeviceLinkLogin({ rememberMe: true });
    await flushPendingRequests();

    await outliveTheSession();

    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK', true);
  });

  it('offers a new session with the choice to be remembered the expired one had', async () => {
    renderDeviceLinkLogin({ rememberMe: true });
    await flushPendingRequests();
    setPageVisibility('hidden');
    await outliveTheSession();
    act(() => setPageVisibility('visible'));

    userEvent.click(screen.getByRole('button', { name: 'Show a new QR code' }));

    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK', true);
  });

  it('stops starting new sessions by itself after five, and offers the button instead', async () => {
    const renewFiveTimes = async () => {
      for (let renewal = 1; renewal <= 5; renewal += 1) {
        const { unmount } = renderDeviceLinkLogin();
        // eslint-disable-next-line no-await-in-loop
        await flushPendingRequests();
        // eslint-disable-next-line no-await-in-loop
        await outliveTheSession();
        unmount();
      }
    };
    await renewFiveTimes();
    renderDeviceLinkLogin();
    await flushPendingRequests();

    await outliveTheSession();

    expect(onSmartIdLoginStart).toHaveBeenCalledTimes(5);
    expect(screen.getByText('The QR code expired.')).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Show a new QR code' }));
    expect(onSmartIdLoginStart).toHaveBeenCalledTimes(6);
  });

  it('offers a new session, without starting one, when the QR code expires out of view', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();
    setPageVisibility('hidden');

    await outliveTheSession();
    act(() => setPageVisibility('visible'));

    expect(onSmartIdLoginStart).not.toHaveBeenCalled();
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByText('The QR code expired.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const requestsBeforeExpiry = mockGetSmartIdQrCodeLink.mock.calls.length;

    await advanceOneSecond();
    expect(mockGetSmartIdQrCodeLink).toHaveBeenCalledTimes(requestsBeforeExpiry);

    userEvent.click(screen.getByRole('button', { name: 'Show a new QR code' }));
    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK', false);
  });

  it('stacks the new QR code button above an equally wide Cancel', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();
    setPageVisibility('hidden');
    await outliveTheSession();

    expectStackedFullWidth(
      screen.getByRole('button', { name: 'Show a new QR code' }),
      screen.getByRole('button', { name: 'Cancel' }),
    );
  });

  it('expires a resumed QR code a minute after its session started, not after the reload', async () => {
    sessionStorage.setItem(
      'pendingSmartIdAuthentication',
      JSON.stringify({
        authenticationHash: 'an-authentication-hash',
        web2AppLink,
        startedAt: Date.now() - 50000,
      }),
    );
    renderDeviceLinkLogin();
    await flushPendingRequests();

    setPageVisibility('hidden');
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByText('The QR code expired.')).toBeInTheDocument();
  });

  it('shows the QR code as expired once the backend no longer knows the session', async () => {
    mockGetSmartIdQrCodeLink.mockRejectedValue({
      status: 401,
      body: { errors: [{ code: 'auth.session.not.found' }] },
    });
    renderDeviceLinkLogin();
    await flushPendingRequests();

    expect(screen.getByText('The QR code expired.')).toBeInTheDocument();
    expect(onSmartIdLoginStart).not.toHaveBeenCalled();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('cancels the login from the QR code view', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('offers the same full-width Cancel under the QR code as on every other login screen', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();

    expectFullWidthCancel(screen.getByRole('button', { name: 'Cancel' }));
  });

  describe('on a phone, which has left for the Smart-ID app', () => {
    const appButton = () => screen.queryByRole('link', { name: 'Open the Smart\u2011ID app' });
    const waitInView = (millis: number) =>
      act(() => {
        jest.advanceTimersByTime(millis);
      });

    beforeEach(() => setUserAgent(phoneUserAgent));

    it('shows nothing but a spinner and Cancel while the Smart-ID app opens', async () => {
      const { container } = renderDeviceLinkLogin();
      await flushPendingRequests();

      expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
      expect(container).toHaveTextContent(/^Cancel$/);
      expect(appButton()).not.toBeInTheDocument();
      expect(mockGetSmartIdQrCodeLink).not.toHaveBeenCalled();
    });

    it('moves the focus to Cancel, so keyboard users are not left on the page itself', async () => {
      renderDeviceLinkLogin();
      await flushPendingRequests();

      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });

    it('cancels the login while the Smart-ID app opens', async () => {
      renderDeviceLinkLogin();
      await flushPendingRequests();

      userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('offers a button into the Smart-ID app when the page stays in view for 2 seconds', async () => {
      renderDeviceLinkLogin();
      await flushPendingRequests();

      waitInView(1999);
      expect(appButton()).not.toBeInTheDocument();

      waitInView(1);
      expect(appButton()).toHaveAttribute('href', web2AppLink);
    });

    it.each([
      ['en', 'Open the Smart\u2011ID app'],
      ['et', 'Ava Smart\u2011ID rakendus'],
    ] as const)('names the button into the Smart-ID app in %s', async (language, name) => {
      renderDeviceLinkLogin({ language });
      await flushPendingRequests();

      waitInView(2000);

      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    });

    it('offers no button into the Smart-ID app when the page went out of view within 2 seconds', async () => {
      renderDeviceLinkLogin();
      await flushPendingRequests();

      waitInView(1000);
      act(() => setPageVisibility('hidden'));
      waitInView(5000);

      expect(appButton()).not.toBeInTheDocument();
    });

    it('offers the button into the Smart-ID app when they come back from the app without finishing', async () => {
      renderDeviceLinkLogin();
      await flushPendingRequests();
      act(() => setPageVisibility('hidden'));
      waitInView(5000);

      act(() => setPageVisibility('visible'));

      expect(appButton()).toHaveAttribute('href', web2AppLink);
    });

    it('moves the focus to the button into the Smart-ID app when it appears', async () => {
      renderDeviceLinkLogin();
      await flushPendingRequests();

      waitInView(2000);

      expect(appButton()).toHaveFocus();
    });

    it('stacks the button into the Smart-ID app above an equally wide Cancel', async () => {
      renderDeviceLinkLogin();
      await flushPendingRequests();

      waitInView(2000);

      expectStackedFullWidth(
        screen.getByRole('link', { name: 'Open the Smart\u2011ID app' }),
        screen.getByRole('button', { name: 'Cancel' }),
      );
    });

    it('marks the button into the Smart-ID app with the Smart-ID mark before its label', async () => {
      renderDeviceLinkLogin();
      await flushPendingRequests();

      waitInView(2000);

      const button = screen.getByRole('link', { name: 'Open the Smart\u2011ID app' });
      const mark = within(button).getByTestId('smart-id-mark-icon');
      expect(mark).toHaveAttribute('aria-hidden', 'true');
      expect(
        mark.compareDocumentPosition(within(button).getByText('Open the Smart\u2011ID app')),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });
});
