import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import { SmartIdLoginTab } from './SmartIdLoginTab';
import { forgetRememberedSmartIdAccount, getRememberedSmartIdAccount } from '../../common/api';

jest.mock('../../common/api');

const mockGetRememberedSmartIdAccount = getRememberedSmartIdAccount as jest.MockedFunction<
  typeof getRememberedSmartIdAccount
>;
const mockForgetRememberedSmartIdAccount = forgetRememberedSmartIdAccount as jest.MockedFunction<
  typeof forgetRememberedSmartIdAccount
>;

describe('Smart-ID login tab', () => {
  const onSmartIdLoginStart = jest.fn();
  const desktopUserAgent = navigator.userAgent;

  const setUserAgent = (userAgent: string) =>
    Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });

  const renderTab = () =>
    render(
      <IntlProvider locale="en" messages={translations.en}>
        <SmartIdLoginTab onSmartIdLoginStart={onSmartIdLoginStart} />
      </IntlProvider>,
    );

  beforeEach(() => {
    onSmartIdLoginStart.mockReset();
    mockGetRememberedSmartIdAccount.mockReset();
    mockForgetRememberedSmartIdAccount.mockReset();
    mockForgetRememberedSmartIdAccount.mockResolvedValue(undefined);
  });

  afterEach(() => setUserAgent(desktopUserAgent));

  it('offers the QR login when the browser remembers no account', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue(null);
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: 'Log in with Smart-ID' }));

    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK');
    expect(screen.queryByText(/Not you/)).not.toBeInTheDocument();
  });

  it('offers a push login to the remembered account', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: 'Continue as Mari' }));

    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'NOTIFICATION');
    expect(screen.queryByText('Maasikas')).not.toBeInTheDocument();
  });

  it('forgets the remembered account and falls back to the QR login for somebody else', async () => {
    mockGetRememberedSmartIdAccount.mockResolvedValue({ firstName: 'Mari', lastName: 'Maasikas' });
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: /Not you/ }));

    await waitFor(() => expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK'));
    expect(mockForgetRememberedSmartIdAccount).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Log in with Smart-ID' })).toBeInTheDocument();
  });

  it('never asks about remembered accounts on a phone, where the same-device link is used', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
    renderTab();

    userEvent.click(screen.getByRole('button', { name: 'Log in with Smart-ID' }));

    expect(mockGetRememberedSmartIdAccount).not.toHaveBeenCalled();
    expect(onSmartIdLoginStart).toHaveBeenCalledWith('en', 'DEVICE_LINK');
  });

  it('treats a failed remembered account lookup as no account', async () => {
    mockGetRememberedSmartIdAccount.mockRejectedValue(new Error('offline'));
    renderTab();

    expect(await screen.findByRole('button', { name: 'Log in with Smart-ID' })).toBeInTheDocument();
  });
});
