import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Switch } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';

import { createDefaultStore, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { smartIdAuthenticationBackend } from '../../../test/backend';
import { getAuthentication } from '../../common/authenticationManager';
import { SmartIdCallbackPage } from './SmartIdCallbackPage';
import { loginPath, smartIdCallbackPath } from '../constants';

jest.unmock('react-intl');

describe('When the Smart-ID app returns to the browser', () => {
  const server = setupServer();

  let history: History;

  const openCallback = (search: string) => {
    history = createMemoryHistory({ initialEntries: [`${smartIdCallbackPath}${search}`] });
    renderWrapped(
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

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const rememberDestination = (returnPath: string) =>
    sessionStorage.setItem(
      'pendingSmartIdAuthentication',
      JSON.stringify({ returnPath, startedAt: Date.now() }),
    );

  beforeEach(() => {
    initializeConfiguration();
    getAuthentication().remove();
    sessionStorage.clear();
  });

  test('the login completes and the account page opens with the login landing flag', async () => {
    const backend = smartIdAuthenticationBackend(server);
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

  test('a login headed for the app root lands on the account page with the login landing flag', async () => {
    const backend = smartIdAuthenticationBackend(server);
    backend.resolvePolling();
    rememberDestination('/');

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
    rememberDestination('/capital/listings/42');

    openCallback(
      '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier',
    );

    expect(
      await screen.findByText(/mock listing page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toBeUndefined();
  });

  test('a rejected callback offers a way back to the login page', async () => {
    smartIdAuthenticationBackend(server, { rejectCallback: true });

    openCallback(
      '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier',
    );

    expect(
      await screen.findByText('The login could not be completed. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', loginPath);
  });

  test('a callback without parameters never reaches the backend', async () => {
    smartIdAuthenticationBackend(server, { rejectCallback: true });

    openCallback('');

    expect(
      await screen.findByText('The login could not be completed. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', loginPath);
  });

  const aCallback =
    '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier';

  test('says the login is being finished while it completes', async () => {
    smartIdAuthenticationBackend(server);

    openCallback(aCallback);

    expect(await screen.findByText('Finishing your login…')).toBeInTheDocument();
  });

  test('a callback request that fails on the way offers a way back instead of spinning', async () => {
    smartIdAuthenticationBackend(server);
    server.use(
      rest.post('http://localhost/v1/smart-id/login/callback', (req, res) =>
        res.networkError('Failed to connect'),
      ),
    );

    openCallback(aCallback);

    expect(
      await screen.findByText('The login could not be completed. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', loginPath);
  });

  test('says why Smart-ID refused the login', async () => {
    smartIdAuthenticationBackend(server);
    server.use(
      rest.post('http://localhost/oauth/token', (req, res, ctx) =>
        res(ctx.status(400), ctx.json({ errors: [{ code: 'smart.id.user.refused' }] })),
      ),
    );

    openCallback(aCallback);

    expect(
      await screen.findByText(/^You cancelled the login in the Smart.ID app\.$/, undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument();
  });

  test('offers a way out when finishing the login takes too long', () => {
    jest.useFakeTimers();
    smartIdAuthenticationBackend(server);
    server.use(
      rest.post('http://localhost/v1/smart-id/login/callback', () => new Promise<never>(() => {})),
    );

    openCallback(aCallback);
    expect(screen.queryByRole('link', { name: 'Cancel' })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(20000);
    });
    userEvent.click(screen.getByRole('link', { name: 'Cancel' }));

    expect(screen.getByText(/mock login page/i)).toBeInTheDocument();
    jest.useRealTimers();
  });
});
