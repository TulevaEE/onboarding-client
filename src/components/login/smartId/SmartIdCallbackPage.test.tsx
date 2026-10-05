import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Switch } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';

import { createDefaultStore, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { smartIdAuthenticationBackend } from '../../../test/backend';
import { getAuthentication } from '../../common/authenticationManager';
import { anAuthenticationManager } from '../../common/authenticationManagerFixture';
import { SmartIdCallbackPage } from './SmartIdCallbackPage';
import { loginPath, smartIdCallbackPath } from '../constants';
import { expectFullWidthCancel } from '../../../test/expectFullWidthCancel';

jest.unmock('react-intl');

describe('When the Smart-ID app returns to the browser', () => {
  const server = setupServer();

  let history: History;

  const openCallback = (search: string) => {
    history = createMemoryHistory({ initialEntries: [`${smartIdCallbackPath}${search}`] });
    return renderWrapped(
      <Switch>
        <Route exact path="/account" render={() => <h1>Mock account page</h1>} />
        <Route exact path="/capital/listings/42" render={() => <h1>Mock listing page</h1>} />
        <Route exact path={loginPath} render={() => <h1>Mock login page</h1>} />
        <Route exact path={smartIdCallbackPath} component={SmartIdCallbackPage} />
      </Switch>,
      history as never,
      createDefaultStore(history as never),
    );
  };

  const arriveFromTheSmartIdAppWithTheCallbackMovedOutOfTheAddress = () => {
    sessionStorage.setItem(
      'smartIdCallback',
      JSON.stringify({
        value: 'a-callback-value',
        sessionSecretDigest: 'a-digest',
        userChallengeVerifier: 'a-verifier',
      }),
    );
    return openCallback('');
  };

  const reload = (firstLoad: ReturnType<typeof openCallback>) => {
    firstLoad.unmount();
    return openCallback('');
  };

  const aCallback =
    '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier';

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const startLoginBeforeTheAppRoundTrip = (
    backend: ReturnType<typeof smartIdAuthenticationBackend>,
    returnPath?: string,
  ) =>
    sessionStorage.setItem(
      'pendingSmartIdAuthentication',
      JSON.stringify({
        authenticationHash: backend.startSession(),
        returnPath,
        startedAt: Date.now(),
      }),
    );

  beforeEach(() => {
    initializeConfiguration();
    getAuthentication().remove();
    sessionStorage.clear();
    delete window.smartIdCallback;
  });

  test('the login completes and the account page opens with the login landing flag', async () => {
    const backend = smartIdAuthenticationBackend(server);
    startLoginBeforeTheAppRoundTrip(backend);
    backend.resolvePolling();

    openCallback(
      '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier',
    );

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  test('the login completes from the parameters the page moved out of its address', async () => {
    const backend = smartIdAuthenticationBackend(server);
    startLoginBeforeTheAppRoundTrip(backend);
    backend.resolvePolling();
    sessionStorage.setItem(
      'smartIdCallback',
      JSON.stringify({
        value: 'a-callback-value',
        sessionSecretDigest: 'a-digest',
        userChallengeVerifier: 'a-verifier',
      }),
    );

    openCallback('');

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem('smartIdCallback')).toBeNull();
  });

  test('the login completes from the parameters the page kept in memory when the session storage refused them', async () => {
    const backend = smartIdAuthenticationBackend(server);
    startLoginBeforeTheAppRoundTrip(backend);
    backend.resolvePolling();
    window.smartIdCallback = {
      value: 'a-callback-value',
      sessionSecretDigest: 'a-digest',
      userChallengeVerifier: 'a-verifier',
    };

    openCallback('');

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(window.smartIdCallback).toBeUndefined();
  });

  test('a login headed for the app root lands on the account page with the login landing flag', async () => {
    const backend = smartIdAuthenticationBackend(server);
    backend.resolvePolling();
    startLoginBeforeTheAppRoundTrip(backend, '/');

    openCallback(
      '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier',
    );

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  test('the login continues to the page the person was heading for', async () => {
    const backend = smartIdAuthenticationBackend(server);
    backend.resolvePolling();
    startLoginBeforeTheAppRoundTrip(backend, '/capital/listings/42');

    openCallback(
      '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier',
    );

    expect(
      await screen.findByText(/mock listing page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toBeUndefined();
  });

  test('the login completes in a new tab the Smart-ID app opened, which has no pending login of its own', async () => {
    const backend = smartIdAuthenticationBackend(server);
    backend.startSession();
    backend.resolvePolling();

    openCallback(aCallback);

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  test('the login completes with the redemption secret of the accepted callback, not the hash the login started with', async () => {
    const backend = smartIdAuthenticationBackend(server);
    startLoginBeforeTheAppRoundTrip(backend);
    backend.resolvePolling();

    openCallback(aCallback);

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(backend.acceptedCallbacks).toBe(1);
    expect(sessionStorage.getItem('pendingSmartIdAuthentication')).toBeNull();
  });

  test('a callback the backend has no login for offers a way back to the login page', async () => {
    smartIdAuthenticationBackend(server);

    openCallback(aCallback);

    expect(
      await screen.findByText('There appears to have been a mistake. Please try again.'),
    ).toBeInTheDocument();
    expect(getAuthentication().isAuthenticated()).toBe(false);
  });

  test('a rejected callback offers a way back to the login page and forgets the pending login', async () => {
    const backend = smartIdAuthenticationBackend(server, { rejectCallback: true });
    startLoginBeforeTheAppRoundTrip(backend);

    openCallback(
      '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier',
    );

    expect(
      await screen.findByText('There appears to have been a mistake. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', loginPath);
    expect(sessionStorage.getItem('pendingSmartIdAuthentication')).toBeNull();
  });

  test('a reload while the accepted callback waits for the tokens resumes the login without submitting the callback again', async () => {
    const backend = smartIdAuthenticationBackend(server);
    backend.startSession();
    const firstLoad = arriveFromTheSmartIdAppWithTheCallbackMovedOutOfTheAddress();
    await waitFor(() => expect(backend.acceptedCallbacks).toBe(1));
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    reload(firstLoad);
    backend.resolvePolling();

    expect(screen.queryByRole('link', { name: 'Try again' })).not.toBeInTheDocument();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(backend.acceptedCallbacks).toBe(1);
  });

  test('a reload before the callback was answered submits it once more and completes the login', async () => {
    const backend = smartIdAuthenticationBackend(server, { loseFirstCallbackAnswer: true });
    backend.startSession();
    const firstLoad = arriveFromTheSmartIdAppWithTheCallbackMovedOutOfTheAddress();
    await waitFor(() => expect(backend.acceptedCallbacks).toBe(1));

    reload(firstLoad);
    backend.resolvePolling();

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(backend.acceptedCallbacks).toBe(2);
  });

  test('a reload after a rejected callback does not submit it again', async () => {
    const backend = smartIdAuthenticationBackend(server, { rejectCallback: true });
    backend.startSession();
    const firstLoad = arriveFromTheSmartIdAppWithTheCallbackMovedOutOfTheAddress();
    expect(
      await screen.findByText('There appears to have been a mistake. Please try again.'),
    ).toBeInTheDocument();

    reload(firstLoad);

    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', loginPath);
    expect(sessionStorage.getItem('smartIdCallback')).toBeNull();
  });

  test.each([
    ['moved out of its address', arriveFromTheSmartIdAppWithTheCallbackMovedOutOfTheAddress],
    [
      'kept in memory',
      () => {
        window.smartIdCallback = {
          value: 'a-callback-value',
          sessionSecretDigest: 'a-digest',
          userChallengeVerifier: 'a-verifier',
        };
        return openCallback('');
      },
    ],
  ])(
    'a browser that is already logged in forgets the callback parameters the page %s without submitting them',
    async (_where, arrive) => {
      const backend = smartIdAuthenticationBackend(server);
      backend.startSession();
      getAuthentication().update(anAuthenticationManager());

      arrive();

      expect(await screen.findByText(/mock account page/gi)).toBeInTheDocument();
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
      expect(sessionStorage.getItem('smartIdCallback')).toBeNull();
      expect(window.smartIdCallback).toBeUndefined();
      expect(backend.acceptedCallbacks).toBe(0);
    },
  );

  test('a callback without parameters never reaches the backend', async () => {
    smartIdAuthenticationBackend(server, { rejectCallback: true });

    openCallback('');

    expect(
      await screen.findByText('There appears to have been a mistake. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', loginPath);
  });

  test('shows nothing but a spinner while the login completes', () => {
    startLoginBeforeTheAppRoundTrip(smartIdAuthenticationBackend(server));

    const { container } = openCallback(aCallback);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(container).toHaveTextContent(/^$/);
  });

  test('a callback request that fails on the way offers a way back instead of spinning', async () => {
    startLoginBeforeTheAppRoundTrip(smartIdAuthenticationBackend(server));
    server.use(
      rest.post('http://localhost/v1/smart-id/login/callback', (req, res) =>
        res.networkError('Failed to connect'),
      ),
    );

    openCallback(aCallback);

    expect(
      await screen.findByText('There appears to have been a mistake. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', loginPath);
  });

  test('cancelling in the Smart-ID app goes back to the login page without an error', async () => {
    startLoginBeforeTheAppRoundTrip(smartIdAuthenticationBackend(server));
    server.use(
      rest.post('http://localhost/oauth/token', (req, res, ctx) =>
        res(ctx.status(400), ctx.json({ errors: [{ code: 'smart.id.user.refused' }] })),
      ),
    );

    openCallback(aCallback);

    expect(
      await screen.findByText(/mock login page/i, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('says why Smart-ID ended the login any other way', async () => {
    startLoginBeforeTheAppRoundTrip(smartIdAuthenticationBackend(server));
    server.use(
      rest.post('http://localhost/oauth/token', (req, res, ctx) =>
        res(ctx.status(400), ctx.json({ errors: [{ code: 'smart.id.wrong.verification.code' }] })),
      ),
    );

    openCallback(aCallback);

    expect(
      await screen.findByText(
        /^You chose the wrong verification code in the Smart.ID app/,
        undefined,
        {
          timeout: 3000,
        },
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', loginPath);
  });

  test('offers a way out when finishing the login takes too long', () => {
    jest.useFakeTimers();
    startLoginBeforeTheAppRoundTrip(smartIdAuthenticationBackend(server));
    server.use(
      rest.post('http://localhost/v1/smart-id/login/callback', () => new Promise<never>(() => {})),
    );

    openCallback(aCallback);
    expect(screen.queryByRole('link', { name: 'Cancel' })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expectFullWidthCancel(screen.getByRole('link', { name: 'Cancel' }));
    userEvent.click(screen.getByRole('link', { name: 'Cancel' }));

    expect(screen.getByText(/mock login page/i)).toBeInTheDocument();
    jest.useRealTimers();
  });
});
