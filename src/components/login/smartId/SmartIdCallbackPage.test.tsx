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
import { replaceWindowLocationAssign } from '../../../test/windowLocationAssign';
import { smartIdWeb2AppLink } from '../../../test/backend-responses';
// eslint-disable-next-line import/no-named-as-default
import LoginPage from '../LoginPage';

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

  const aCallbackReturningTo = (returnPath: string) =>
    `?returnPath=${encodeURIComponent(returnPath)}&${aCallback.slice(1)}`;

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

  test('the login completes in a new tab the Smart-ID app opened and continues to the page the login started from', async () => {
    const backend = smartIdAuthenticationBackend(server);
    backend.startSession();
    backend.resolvePolling();

    openCallback(aCallbackReturningTo('/capital/listings/42'));

    expect(
      await screen.findByText(/mock listing page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('the page the callback address carries wins over the one an older login left in this tab', async () => {
    const backend = smartIdAuthenticationBackend(server);
    sessionStorage.setItem(
      'pendingSmartIdAuthentication',
      JSON.stringify({
        authenticationHash: 'an-older-login',
        returnPath: '/account',
        startedAt: Date.now() - 60 * 60 * 1000,
      }),
    );
    backend.startSession();
    backend.resolvePolling();

    openCallback(aCallbackReturningTo('/capital/listings/42'));

    expect(
      await screen.findByText(/mock listing page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('a page an expired login left in this tab is not where a callback without one lands', async () => {
    const backend = smartIdAuthenticationBackend(server);
    sessionStorage.setItem(
      'pendingSmartIdAuthentication',
      JSON.stringify({
        authenticationHash: 'an-older-login',
        returnPath: '/capital/listings/42',
        startedAt: Date.now() - 60 * 60 * 1000,
      }),
    );
    backend.startSession();
    backend.resolvePolling();

    openCallback(aCallback);

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test.each([
    ['//evil.example/account'],
    ['/\\evil.example/account'],
    ['https://evil.example/account'],
    ['/%5Cevil.example/account'],
    ['/capital/listings/%E0%A4%A'],
  ])(
    'a return path %s in the callback address that leaves the site or cannot be decoded lands on the account page instead',
    async (returnPath) => {
      const backend = smartIdAuthenticationBackend(server);
      backend.startSession();
      backend.resolvePolling();

      openCallback(aCallbackReturningTo(returnPath));

      expect(
        await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
      ).toBeInTheDocument();
      expect(history.location.state).toEqual({ justLoggedIn: true });
    },
  );

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

  test('a callback in a browser that did not start the login offers to log in here, says why a private window cannot and what to do instead', async () => {
    smartIdAuthenticationBackend(server);

    openCallback(aCallback);

    expect(
      await screen.findByText(
        /^Smart.ID opened Tuleva in a different browser or window\. Tap Try again\. Logging in does not work in a private window, because the Smart.ID app cannot bring you back to it\. Open Tuleva in a normal window instead\.$/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', loginPath);
    expect(getAuthentication().isAuthenticated()).toBe(false);
  });

  describe('in a private Safari tab on an iPhone', () => {
    const desktopUserAgent = navigator.userAgent;
    const browserStorage = Object.getOwnPropertyDescriptor(navigator, 'storage');

    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
      Object.defineProperty(navigator, 'storage', {
        value: {
          getDirectory: () =>
            Promise.reject(
              new Error(
                'The operation failed for an unknown transient reason (e.g. out of memory).',
              ),
            ),
        },
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: desktopUserAgent,
        configurable: true,
      });
      if (browserStorage) {
        Object.defineProperty(navigator, 'storage', browserStorage);
      } else {
        delete (navigator as { storage?: unknown }).storage;
      }
    });

    test('a callback the private tab cannot see tells the person to open a normal tab instead of offering a Try again that would fail the same way', async () => {
      smartIdAuthenticationBackend(server);

      openCallback(aCallback);

      expect(
        await screen.findByText(
          /^Smart.ID does not work in a private window\. Tap ⋯, choose New Tab and open pension\.tuleva\.ee there\.$/,
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Try again' })).not.toBeInTheDocument();
    });
  });

  test('a login that loses its session after the callback was accepted does not blame the browser', async () => {
    const backend = smartIdAuthenticationBackend(server);
    startLoginBeforeTheAppRoundTrip(backend);
    server.use(
      rest.post('http://localhost/oauth/token', (req, res, ctx) =>
        res(ctx.status(401), ctx.json({ errors: [{ code: 'auth.session.not.found' }] })),
      ),
    );

    openCallback(aCallback);

    expect(
      await screen.findByText('There appears to have been a mistake. Please try again.'),
    ).toBeInTheDocument();
    expect(backend.acceptedCallbacks).toBe(1);
  });

  test('a callback the login in this browser does not accept, because another login started here since, offers to log in here and forgets the pending login', async () => {
    const backend = smartIdAuthenticationBackend(server, { rejectCallback: true });
    startLoginBeforeTheAppRoundTrip(backend);

    openCallback(
      '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier',
    );

    expect(
      await screen.findByText(/^Smart.ID opened Tuleva in a different browser or window\./),
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
      await screen.findByText(/^Smart.ID opened Tuleva in a different browser or window\./),
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

  describe('trying again', () => {
    const desktopUserAgent = navigator.userAgent;
    const phoneUserAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
    const tabletUserAgent = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
    const locationAssign = jest.fn();
    let restoreLocation: () => void;

    const pretendToBeOn = (userAgent: string) =>
      Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });

    const openFailedCallbackBeforeTheLoginPage = (
      language: 'en' | 'et' = 'en',
      callback: string = aCallback,
    ) => {
      history = createMemoryHistory({ initialEntries: [`${smartIdCallbackPath}${callback}`] });
      return renderWrapped(
        <Switch>
          <Route exact path="/account" render={() => <h1>Mock account page</h1>} />
          <Route exact path="/capital/listings/42" render={() => <h1>Mock listing page</h1>} />
          <Route exact path={loginPath} component={LoginPage} />
          <Route exact path={smartIdCallbackPath} component={SmartIdCallbackPage} />
        </Switch>,
        history as never,
        createDefaultStore(history as never),
        undefined,
        language,
      );
    };

    beforeEach(() => {
      locationAssign.mockReset();
      restoreLocation = replaceWindowLocationAssign(locationAssign);
    });

    afterEach(() => {
      restoreLocation();
      pretendToBeOn(desktopUserAgent);
    });

    test('on a phone one tap starts a new session, opens its Smart-ID app and waits for it on the login page', async () => {
      pretendToBeOn(phoneUserAgent);
      const backend = smartIdAuthenticationBackend(server, {
        rejectCallback: true,
        language: 'en',
      });
      startLoginBeforeTheAppRoundTrip(backend);
      openFailedCallbackBeforeTheLoginPage();

      userEvent.click(await screen.findByRole('link', { name: 'Try again' }));

      await waitFor(() => expect(locationAssign).toHaveBeenCalledWith(smartIdWeb2AppLink('en')));
      expect(locationAssign).toHaveBeenCalledTimes(1);
      expect(backend.startedSessions).toBe(2);
      expect(history.location.pathname).toBe(loginPath);
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Smart-ID' })).toContainElement(
        screen.getByRole('status', { name: 'Loading' }),
      );
      expect(screen.getByRole('region', { name: 'Smart-ID' })).toHaveTextContent(
        /Confirm the login in the Smart.ID app\.\s*Cancel$/,
      );

      backend.resolvePolling();
      expect(
        await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
      ).toBeInTheDocument();
    });

    test.each([
      ['smart.id.account.not.found'],
      ['smart.id.unsupported.country'],
      ['smart.id.certificate.revoked'],
      ['smart.id.account.unusable'],
    ])(
      'on a phone %s, which a new session cannot fix, goes back to the login page with its explanation and no session',
      async (errorCode) => {
        pretendToBeOn(phoneUserAgent);
        const backend = smartIdAuthenticationBackend(server, { language: 'en' });
        server.use(
          rest.post('http://localhost/oauth/token', (req, res, ctx) =>
            res(ctx.status(400), ctx.json({ errors: [{ code: errorCode }] })),
          ),
        );
        startLoginBeforeTheAppRoundTrip(backend);
        openFailedCallbackBeforeTheLoginPage();
        const explanation = (
          await screen.findByRole('alert', undefined, { timeout: 3000 })
        ).textContent?.replace(/\s+/g, ' ');

        userEvent.click(screen.getByRole('link', { name: 'Try again' }));

        expect(await screen.findByRole('tabpanel')).toBeInTheDocument();
        expect(history.location.pathname).toBe(loginPath);
        expect(screen.getByRole('alert')).toHaveTextContent(explanation ?? 'no explanation');
        expect(backend.startedSessions).toBe(1);
        expect(locationAssign).not.toHaveBeenCalled();
      },
    );

    test('on a phone in a browser that did not start the login, one tap starts a new session that continues to the page the login started from', async () => {
      pretendToBeOn(phoneUserAgent);
      const backend = smartIdAuthenticationBackend(server, { language: 'en' });
      openFailedCallbackBeforeTheLoginPage('en', aCallbackReturningTo('/capital/listings/42'));

      userEvent.click(await screen.findByRole('link', { name: 'Try again' }));

      await waitFor(() => expect(locationAssign).toHaveBeenCalledWith(smartIdWeb2AppLink('en')));
      expect(backend.deviceLinkReturnPaths).toEqual(['/capital/listings/42']);
      backend.resolvePolling();
      expect(
        await screen.findByText(/mock listing page/gi, undefined, { timeout: 3000 }),
      ).toBeInTheDocument();
    });

    test.each([
      ['tablet', tabletUserAgent],
      ['computer', desktopUserAgent],
    ])(
      'on a %s in a browser that did not start the login, the login page it goes back to continues to the page the login started from',
      async (device, userAgent) => {
        pretendToBeOn(userAgent);
        const backend = smartIdAuthenticationBackend(server, { language: 'en' });
        openFailedCallbackBeforeTheLoginPage('en', aCallbackReturningTo('/capital/listings/42'));

        userEvent.click(await screen.findByRole('link', { name: 'Try again' }));
        userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));

        await waitFor(() =>
          expect(backend.deviceLinkReturnPaths).toEqual(['/capital/listings/42']),
        );
        backend.resolvePolling();
        expect(
          await screen.findByText(/mock listing page/gi, undefined, { timeout: 3000 }),
        ).toBeInTheDocument();
      },
    );

    test('on a phone the new session keeps the language of the login', async () => {
      pretendToBeOn(phoneUserAgent);
      const backend = smartIdAuthenticationBackend(server, {
        rejectCallback: true,
        language: 'et',
      });
      startLoginBeforeTheAppRoundTrip(backend);
      openFailedCallbackBeforeTheLoginPage('et');

      userEvent.click(await screen.findByRole('link', { name: 'Proovi uuesti' }));

      await waitFor(() => expect(locationAssign).toHaveBeenCalledWith(smartIdWeb2AppLink('et')));
    });

    test.each([
      ['tablet', tabletUserAgent],
      ['computer', desktopUserAgent],
    ])(
      'on a %s it goes back to the login page without starting a session',
      async (device, userAgent) => {
        pretendToBeOn(userAgent);
        const backend = smartIdAuthenticationBackend(server, {
          rejectCallback: true,
          language: 'en',
        });
        startLoginBeforeTheAppRoundTrip(backend);
        openFailedCallbackBeforeTheLoginPage();

        userEvent.click(await screen.findByRole('link', { name: 'Try again' }));

        expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
        expect(history.location.pathname).toBe(loginPath);
        expect(backend.startedSessions).toBe(1);
        expect(locationAssign).not.toHaveBeenCalled();
      },
    );
  });
});
