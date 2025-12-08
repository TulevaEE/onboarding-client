import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'react-router-dom';
import { createMemoryHistory, MemoryHistory } from 'history';
import config from 'react-global-configuration';
import { IntlProvider } from 'react-intl';
import { ErrorCode } from '@web-eid/web-eid-library/web-eid';

import { IdCardLoginTab } from './loginForm/IdCardLoginTab';
import translations from '../translations/translations.en.json';

const mockAuthenticateWithIdCardWebEid = jest.fn();

jest.mock('../common/api', () => ({
  authenticateWithIdCardWebEid: (...args: unknown[]) => mockAuthenticateWithIdCardWebEid(...args),
}));

const configOptions = { freeze: false, assign: false };

describe('Web eID Auth Integration', () => {
  let queryClient: QueryClient;
  let history: MemoryHistory;

  const renderWithProviders = (ui: React.ReactElement, searchParams = '?webeid=true') => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    history = createMemoryHistory();
    history.push({ search: searchParams });

    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      value: { search: searchParams },
      writable: true,
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <Router history={history}>
          <IntlProvider locale="en" messages={translations}>
            {ui}
          </IntlProvider>
        </Router>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    config.set({ language: 'et' }, configOptions);
  });

  it('should authenticate successfully and redirect to home', async () => {
    const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce(mockTokens);

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    const button = screen.getByRole('button', { name: /log in/i });
    userEvent.click(button);

    await waitFor(() => {
      expect(mockAuthenticateWithIdCardWebEid).toHaveBeenCalledWith('et');
    });

    await waitFor(() => {
      expect(history.location.pathname).toBe('/');
    });
  });

  it('should use configured language', async () => {
    config.set({ language: 'en' }, configOptions);
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce({});

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    const button = screen.getByRole('button');
    userEvent.click(button);

    await waitFor(() => {
      expect(mockAuthenticateWithIdCardWebEid).toHaveBeenCalledWith('en');
    });
  });

  it('should display user cancelled error', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce({
      code: ErrorCode.ERR_WEBEID_USER_CANCELLED,
    });

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/Authentication was cancelled/i)).toBeInTheDocument();
    });
  });

  it('should display extension unavailable error', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce({
      code: ErrorCode.ERR_WEBEID_EXTENSION_UNAVAILABLE,
    });

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/Web eID extension is not available/i)).toBeInTheDocument();
    });
  });

  it('should display generic error for unknown errors', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/check that your ID.*card reader is connected/i)).toBeInTheDocument();
    });
  });

  it('should call mTLS handler when webeid param is not set', () => {
    const onAuthenticateWithIdCardMtls = jest.fn();
    renderWithProviders(
      <IdCardLoginTab onAuthenticateWithIdCardMtls={onAuthenticateWithIdCardMtls} />,
      '',
    );

    userEvent.click(screen.getByRole('button'));

    expect(onAuthenticateWithIdCardMtls).toHaveBeenCalledTimes(1);
    expect(mockAuthenticateWithIdCardWebEid).not.toHaveBeenCalled();
  });

  it('should show loading state while authenticating', async () => {
    let resolveAuth: (value: unknown) => void = () => {};
    const authPromise = new Promise((resolve) => {
      resolveAuth = resolve;
    });
    mockAuthenticateWithIdCardWebEid.mockReturnValueOnce(authPromise);

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    const button = screen.getByRole('button');
    userEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    expect(screen.getByRole('status')).toBeInTheDocument();

    resolveAuth({ accessToken: 'token' });

    await waitFor(() => {
      expect(button).toBeEnabled();
    });
  });
});
