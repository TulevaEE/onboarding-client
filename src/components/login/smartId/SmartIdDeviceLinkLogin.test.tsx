import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import { SmartIdDeviceLinkLogin } from './SmartIdDeviceLinkLogin';
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

  const renderDeviceLinkLogin = () =>
    render(
      <IntlProvider locale="en" messages={translations.en}>
        <SmartIdDeviceLinkLogin
          web2AppLink={web2AppLink}
          onCancel={onCancel}
          onSmartIdLoginStart={onSmartIdLoginStart}
        />
      </IntlProvider>,
    );

  const flushPendingRequests = () => act(async () => undefined);
  const advanceOneSecond = () =>
    act(async () => {
      jest.advanceTimersByTime(1000);
    });

  beforeEach(() => {
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
        'Open the Smart-ID app on your phone, choose Scan QR code and point the camera at this code.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('data-value', qrCodeLinkAfter(0));
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

  it('offers a new session once the QR code expires after a minute', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    expect(screen.getByText('The QR code expired.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const requestsBeforeExpiry = mockGetSmartIdQrCodeLink.mock.calls.length;

    await advanceOneSecond();
    expect(mockGetSmartIdQrCodeLink).toHaveBeenCalledTimes(requestsBeforeExpiry);

    userEvent.click(screen.getByRole('button', { name: 'Show a new QR code' }));
    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en');
  });

  it('cancels the login from the QR code view', async () => {
    renderDeviceLinkLogin();
    await flushPendingRequests();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('opens the Smart-ID app on a phone and offers the link as a fallback', async () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
    const assign = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { assign, search: '' },
      writable: true,
      configurable: true,
    });

    renderDeviceLinkLogin();
    await flushPendingRequests();

    expect(assign).toHaveBeenCalledWith(web2AppLink);
    expect(
      screen.getByText(
        'Confirm the login in the Smart-ID app. You will be brought back here automatically.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the Smart-ID app' })).toHaveAttribute(
      'href',
      web2AppLink,
    );
    expect(mockGetSmartIdQrCodeLink).not.toHaveBeenCalled();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
