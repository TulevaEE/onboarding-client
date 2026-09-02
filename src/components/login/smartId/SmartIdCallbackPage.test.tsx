import React from 'react';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { Route, Switch } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { createDefaultStore, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { smartIdAuthenticationBackend } from '../../../test/backend';
import { getAuthentication } from '../../common/authenticationManager';
import { SmartIdCallbackPage } from './SmartIdCallbackPage';
import { loginPath, smartIdCallbackPath } from '../constants';

jest.unmock('react-intl');

describe('When the Smart-ID app returns to the browser', () => {
  const server = setupServer();

  const openCallback = (search: string) => {
    const history = createMemoryHistory({ initialEntries: [`${smartIdCallbackPath}${search}`] });
    renderWrapped(
      <Switch>
        <Route exact path="/" render={() => <h1>Mock account page</h1>} />
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

  beforeEach(() => {
    initializeConfiguration();
    getAuthentication().remove();
  });

  test('the login completes and the account page opens', async () => {
    const backend = smartIdAuthenticationBackend(server);
    backend.resolvePolling();

    openCallback(
      '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier',
    );

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('a rejected callback offers a way back to the login page', async () => {
    smartIdAuthenticationBackend(server, { rejectCallback: true });

    openCallback(
      '?value=a-callback-value&sessionSecretDigest=a-digest&userChallengeVerifier=a-verifier',
    );

    expect(
      await screen.findByText('The login could not be completed. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', loginPath);
  });

  test('a callback without parameters never reaches the backend', async () => {
    smartIdAuthenticationBackend(server, { rejectCallback: true });

    openCallback('');

    expect(
      await screen.findByText('The login could not be completed. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', loginPath);
  });
});
