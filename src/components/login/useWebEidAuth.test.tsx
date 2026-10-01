import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'react-router-dom';
import { createMemoryHistory, MemoryHistory } from 'history';
import config from 'react-global-configuration';
import { IntlProvider } from 'react-intl';
import {
  ErrorCode,
  ExtensionUnavailableError,
  NativeUnavailableError,
  VersionMismatchError,
} from '@web-eid/web-eid-library';

import { IdCardLoginTab } from './loginForm/IdCardLoginTab';
import translations from '../translations/translations.en.json';

const mockAuthenticateWithIdCardWebEid = jest.fn();
const mockWebEidStatus = jest.fn();

jest.mock('@web-eid/web-eid-library', () => ({
  ...jest.requireActual('@web-eid/web-eid-library'),
  status: (...args: unknown[]) => mockWebEidStatus(...args),
}));

jest.mock('../common/api', () => ({
  authenticateWithIdCardWebEid: (...args: unknown[]) => mockAuthenticateWithIdCardWebEid(...args),
}));

const configOptions = { freeze: false, assign: false };

describe('Web eID Auth Integration', () => {
  let queryClient: QueryClient;
  let history: MemoryHistory;

  const renderWithProviders = (ui: React.ReactElement, searchParams = '') => {
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

  it('should authenticate successfully and land on the account page', async () => {
    const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce(mockTokens);

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    const button = screen.getByRole('button', { name: /log in/i });
    userEvent.click(button);

    await waitFor(() => {
      expect(mockAuthenticateWithIdCardWebEid).toHaveBeenCalledWith({ lang: 'et' });
    });

    await waitFor(() => {
      expect(history.location.pathname).toBe('/account');
    });
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  it('replaces the login entry so going back does not hand out a new landing', async () => {
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce({});

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);
    history.replace({ pathname: '/login' });
    const entriesOnTheLoginPage = history.length;

    userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(history.location.pathname).toBe('/account');
    });
    expect(history.length).toBe(entriesOnTheLoginPage);
    expect(history.action).toBe('REPLACE');
  });

  it('should redirect to location.state.from when set by PrivateRoute', async () => {
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce({});

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);
    history.replace({ pathname: '/login', state: { from: '/capital/listings/42' } });

    userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(history.location.pathname).toBe('/capital/listings/42');
    });
    expect(history.location.state).toBeUndefined();
  });

  it('should treat a redirect from the app root as the ordinary account landing', async () => {
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce({});

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);
    history.replace({ pathname: '/login', state: { from: '/' } });

    userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(history.location.pathname).toBe('/account');
    });
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  it('keeps the query string of an account landing recorded by PrivateRoute', async () => {
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce({});

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);
    history.replace({ pathname: '/login', state: { from: '/account?language=en' } });

    userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(history.location.pathname).toBe('/account');
    });
    expect(history.location.search).toBe('?language=en');
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  it('should use configured language', async () => {
    config.set({ language: 'en' }, configOptions);
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce({});

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    const button = screen.getByRole('button');
    userEvent.click(button);

    await waitFor(() => {
      expect(mockAuthenticateWithIdCardWebEid).toHaveBeenCalledWith({ lang: 'en' });
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

  it.each([
    [
      'the browser extension is missing',
      new ExtensionUnavailableError(),
      /does not have the Web\seID extension/,
      'https://www.id.ee/en/article/configuring-browsers-for-using-id-card/',
    ],
    [
      'the ID software is missing',
      new NativeUnavailableError(),
      /ID.software is not installed/,
      'https://www.id.ee/en/article/install-id-software/',
    ],
    [
      'the ID software needs an update',
      new VersionMismatchError(
        undefined,
        { library: '2.1.0' },
        { extension: false, nativeApp: true },
      ),
      /ID.software needs updating/,
      'https://www.id.ee/en/article/install-id-software/',
    ],
  ])(
    'tells the user %s when the Web eID status check finds it after a failed login',
    async (_, statusError, message, instructionsUrl) => {
      mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce(new ExtensionUnavailableError());
      mockWebEidStatus.mockRejectedValueOnce(statusError);

      renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

      userEvent.click(screen.getByRole('button'));

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', instructionsUrl);
    },
  );

  it('asks to check the card reader when the Web eID status check finds nothing missing', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce(new NativeUnavailableError());
    mockWebEidStatus.mockResolvedValueOnce({
      library: '2.1.0',
      extension: '2.7.0',
      nativeApp: '2.7.0',
    });

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    userEvent.click(screen.getByRole('button'));

    expect(
      await screen.findByText(/check that your ID.*card reader is connected/i),
    ).toBeInTheDocument();
  });

  it('does not check the Web eID status before the user logs in', () => {
    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    expect(mockWebEidStatus).not.toHaveBeenCalled();
  });

  it.each([ErrorCode.ERR_WEBEID_USER_TIMEOUT, ErrorCode.ERR_WEBEID_ACTION_TIMEOUT])(
    'says the PIN1 entry timed out on %s',
    async (code) => {
      mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce({ code });

      renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

      userEvent.click(screen.getByRole('button'));

      expect(await screen.findByText(/time to enter the PIN1 code ran out/i)).toBeInTheDocument();
    },
  );

  it('should display generic error for unknown errors', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<IdCardLoginTab onAuthenticateWithIdCardMtls={jest.fn()} />);

    userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/check that your ID.*card reader is connected/i)).toBeInTheDocument();
    });
  });

  it('should call mTLS handler when ?mtls=true is set', () => {
    const onAuthenticateWithIdCardMtls = jest.fn();
    renderWithProviders(
      <IdCardLoginTab onAuthenticateWithIdCardMtls={onAuthenticateWithIdCardMtls} />,
      '?mtls=true',
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
