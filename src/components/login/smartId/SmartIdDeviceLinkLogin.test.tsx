import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import { SmartIdDeviceLinkLogin } from './SmartIdDeviceLinkLogin';
import { automaticRenewalAllowance, AutomaticRenewalAllowance } from './automaticRenewalAllowance';
import { getSmartIdQrCodeLink } from '../../common/api';

jest.mock('../../common/api');
jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, 'aria-label': label }: { value: string; 'aria-label': string }) => (
    <svg role="img" aria-label={label} data-value={value} />
  ),
}));

const mockGetSmartIdQrCodeLink = getSmartIdQrCodeLink as jest.MockedFunction<
  typeof getSmartIdQrCodeLink
>;

describe('Smart-ID device link login', () => {
  const web2AppLink = 'https://smart-id.com/device-link/?deviceLinkType=Web2App&sessionType=auth';
  const qrCodeLinkAfter = (elapsedSeconds: number) =>
    `https://smart-id.com/device-link/?deviceLinkType=QR&elapsedSeconds=${elapsedSeconds}`;
  const desktopUserAgent = navigator.userAgent;
  const onCancel = jest.fn();
  const onSmartIdLoginStart = jest.fn();

  const setUserAgent = (userAgent: string) =>
    Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });

  let renewals: AutomaticRenewalAllowance;

  const renderDeviceLinkLogin = () =>
    render(
      <IntlProvider locale="en" messages={translations.en}>
        <SmartIdDeviceLinkLogin
          web2AppLink={web2AppLink}
          onCancel={onCancel}
          onSmartIdLoginStart={onSmartIdLoginStart}
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

  it('shows a QR code and scanning instructions on a computer', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();

    expect(
      screen.getByText(
        /^Open the Smart.ID app on your phone, choose Scan QR code and point the camera at this code\.$/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(0));
  });

  it('tells what the Smart-ID app will ask under the QR code', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(
      screen.getByText(/^The Smart.ID app will ask you to confirm logging in to Tuleva\.$/),
    ).toBeInTheDocument();
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
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('starts a new session by itself when the QR code expires while the page is in view', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();

    await outliveTheSession();

    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en');
    expect(screen.queryByText('The QR code expired.')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
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
    expect(screen.getByText('The QR code expired.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const requestsBeforeExpiry = mockGetSmartIdQrCodeLink.mock.calls.length;

    await advanceOneSecond();
    expect(mockGetSmartIdQrCodeLink).toHaveBeenCalledTimes(requestsBeforeExpiry);

    userEvent.click(screen.getByRole('button', { name: 'Show a new QR code' }));
    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en');
  });

  it('expires a resumed QR code a minute after its session started, not after the reload', async () => {
    sessionStorage.setItem(
      'pendingSmartIdAuthentication',
      JSON.stringify({ web2AppLink, startedAt: Date.now() - 50000 }),
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
  });

  it('cancels the login from the QR code view', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('offers the Smart-ID app link and instructions on a phone', async () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');

    renderDeviceLinkLogin();
    await flushPendingRequests();

    expect(
      screen.getByText(
        /^Open the Smart.ID app and confirm the login there\. You will be brought back here automatically\.$/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the Smart-ID app' })).toHaveAttribute(
      'href',
      web2AppLink,
    );
    expect(
      screen.getByText(/^The Smart.ID app will ask you to confirm logging in to Tuleva\.$/),
    ).toBeInTheDocument();
    expect(mockGetSmartIdQrCodeLink).not.toHaveBeenCalled();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
