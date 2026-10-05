import React from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, MemoryHistory } from 'history';
import config from 'react-global-configuration';
import {
  ErrorCode,
  ExtensionUnavailableError,
  NativeUnavailableError,
  VersionMismatchError,
} from '@web-eid/web-eid-library';

import { createDefaultStore, renderWrapped } from '../../test/utils';
// eslint-disable-next-line import/no-named-as-default
import LoginPage from './LoginPage';

const mockAuthenticateWithIdCardWebEid = jest.fn();
const mockWebEidStatus = jest.fn();

jest.mock('@web-eid/web-eid-library', () => ({
  ...jest.requireActual('@web-eid/web-eid-library'),
  status: (...args: unknown[]) => mockWebEidStatus(...args),
}));

jest.mock('../common/api', () => ({
  authenticateWithIdCardWebEid: (...args: unknown[]) => mockAuthenticateWithIdCardWebEid(...args),
  getRememberedSmartIdAccount: () => Promise.resolve(null),
}));

const configOptions = { freeze: false, assign: false };

describe('Web eID Auth Integration', () => {
  let history: MemoryHistory;

  const openLoginPage = () => {
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    });
    history = createMemoryHistory({ initialEntries: ['/login'] });
    return renderWrapped(<LoginPage />, history as never, createDefaultStore(history as never));
  };

  const idCardLogIn = () => screen.getByRole('button', { name: 'Log in' });

  const logInWithIdCard = () => {
    userEvent.click(screen.getByRole('tab', { name: 'ID-card' }));
    userEvent.click(idCardLogIn());
  };

  beforeEach(() => {
    jest.clearAllMocks();
    config.set({ language: 'et' }, configOptions);
  });

  it('should authenticate successfully and land on the account page', async () => {
    const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce(mockTokens);

    openLoginPage();

    logInWithIdCard();

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

    openLoginPage();
    history.replace({ pathname: '/login' });
    const entriesOnTheLoginPage = history.length;

    logInWithIdCard();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/account');
    });
    expect(history.length).toBe(entriesOnTheLoginPage);
    expect(history.action).toBe('REPLACE');
  });

  it('should redirect to location.state.from when set by PrivateRoute', async () => {
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce({});

    openLoginPage();
    history.replace({ pathname: '/login', state: { from: '/capital/listings/42' } });

    logInWithIdCard();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/capital/listings/42');
    });
    expect(history.location.state).toBeUndefined();
  });

  it('should treat a redirect from the app root as the ordinary account landing', async () => {
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce({});

    openLoginPage();
    history.replace({ pathname: '/login', state: { from: '/' } });

    logInWithIdCard();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/account');
    });
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  it('keeps the query string of an account landing recorded by PrivateRoute', async () => {
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce({});

    openLoginPage();
    history.replace({ pathname: '/login', state: { from: '/account?language=en' } });

    logInWithIdCard();

    await waitFor(() => {
      expect(history.location.pathname).toBe('/account');
    });
    expect(history.location.search).toBe('?language=en');
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  it('should use configured language', async () => {
    config.set({ language: 'en' }, configOptions);
    mockAuthenticateWithIdCardWebEid.mockResolvedValueOnce({});

    openLoginPage();

    logInWithIdCard();

    await waitFor(() => {
      expect(mockAuthenticateWithIdCardWebEid).toHaveBeenCalledWith({ lang: 'en' });
    });
  });

  it('shows a failed ID-card login once, above the ID-card tab content', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce({
      code: ErrorCode.ERR_WEBEID_USER_CANCELLED,
    });
    openLoginPage();

    logInWithIdCard();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Authentication was cancelled/i);
    expect(screen.getAllByRole('alert')).toEqual([alert]);
    expect(within(screen.getByRole('tabpanel')).getByRole('alert')).toBe(alert);
    expect(alert.compareDocumentPosition(idCardLogIn())).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('clears a failed ID-card login when the user switches to another login method', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce({
      code: ErrorCode.ERR_WEBEID_USER_CANCELLED,
    });
    openLoginPage();
    logInWithIdCard();
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    userEvent.click(screen.getByRole('tab', { name: 'Smart-ID' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ignores the failure of an ID-card login the user left for another login method', async () => {
    let failIdCardLogin: (error: unknown) => void = () => {};
    mockAuthenticateWithIdCardWebEid.mockReturnValueOnce(
      new Promise((resolve, reject) => {
        failIdCardLogin = reject;
      }),
    );
    openLoginPage();
    logInWithIdCard();
    await waitFor(() => expect(mockAuthenticateWithIdCardWebEid).toHaveBeenCalled());
    userEvent.click(screen.getByRole('tab', { name: 'Smart-ID' }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    failIdCardLogin({ code: ErrorCode.ERR_WEBEID_USER_CANCELLED });
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears a failed ID-card login when the user tries again', async () => {
    mockAuthenticateWithIdCardWebEid
      .mockRejectedValueOnce({ code: ErrorCode.ERR_WEBEID_USER_CANCELLED })
      .mockReturnValueOnce(new Promise(() => {}));
    openLoginPage();
    logInWithIdCard();
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    userEvent.click(idCardLogIn());

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('should display user cancelled error', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce({
      code: ErrorCode.ERR_WEBEID_USER_CANCELLED,
    });

    openLoginPage();

    logInWithIdCard();

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

      openLoginPage();

      logInWithIdCard();

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(within(screen.getByRole('alert')).getByRole('link')).toHaveAttribute(
        'href',
        instructionsUrl,
      );
    },
  );

  it('asks to check the card reader when the Web eID status check finds nothing missing', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce(new NativeUnavailableError());
    mockWebEidStatus.mockResolvedValueOnce({
      library: '2.1.0',
      extension: '2.7.0',
      nativeApp: '2.7.0',
    });

    openLoginPage();

    logInWithIdCard();

    expect(
      await screen.findByText(/check that your ID.*card reader is connected/i),
    ).toBeInTheDocument();
  });

  it('does not check the Web eID status before the user logs in', () => {
    openLoginPage();
    userEvent.click(screen.getByRole('tab', { name: 'ID-card' }));

    expect(mockWebEidStatus).not.toHaveBeenCalled();
  });

  it.each([ErrorCode.ERR_WEBEID_USER_TIMEOUT, ErrorCode.ERR_WEBEID_ACTION_TIMEOUT])(
    'says the PIN1 entry timed out on %s',
    async (code) => {
      mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce({ code });

      openLoginPage();

      logInWithIdCard();

      expect(await screen.findByText(/time to enter the PIN1 code ran out/i)).toBeInTheDocument();
    },
  );

  it('should explain a card type the backend refuses', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce({
      status: 400,
      body: { errors: [{ code: 'id.card.document.type.not.allowed' }] },
    });

    openLoginPage();

    logInWithIdCard();

    await waitFor(() => {
      expect(
        screen.getByText(/This type of ID-card cannot be used to log in/i),
      ).toBeInTheDocument();
    });
  });

  it('should display generic error for unknown errors', async () => {
    mockAuthenticateWithIdCardWebEid.mockRejectedValueOnce(new Error('Network error'));

    openLoginPage();

    logInWithIdCard();

    await waitFor(() => {
      expect(screen.getByText(/check that your ID.*card reader is connected/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while authenticating', async () => {
    let resolveAuth: (value: unknown) => void = () => {};
    const authPromise = new Promise((resolve) => {
      resolveAuth = resolve;
    });
    mockAuthenticateWithIdCardWebEid.mockReturnValueOnce(authPromise);

    openLoginPage();

    logInWithIdCard();
    const button = idCardLogIn();

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
