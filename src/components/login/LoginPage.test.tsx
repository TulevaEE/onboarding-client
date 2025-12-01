import React from 'react';
import { setupServer } from 'msw/node';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Switch } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';

import { createDefaultStore, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';

// eslint-disable-next-line import/no-named-as-default
import LoginPage, { loginPath } from './LoginPage';
import {
  smartIdAuthenticationBackend,
  mobileIdAuthenticationBackend,
  idCardAuthenticationBackend,
} from '../../test/backend';
import { getAuthentication } from '../common/authenticationManager';

jest.unmock('react-intl');

describe('When a user is logging in', () => {
  const server = setupServer();
  let history: History;

  function initializeComponent() {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);

    renderWrapped(
      <Switch>
        <Route exact path="/" render={() => <h1>Mock account page</h1>} />
        <Route exact path={loginPath} component={LoginPage} />
      </Switch>,
      history as any,
      store,
    );
  }
  beforeEach(() => {
    initializeConfiguration();
    getAuthentication().remove();
    initializeComponent();
    act(() => {
      history.push('/login');
    });
  });
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  test('they can sign in with smart id, showing the security code', async () => {
    const user = userEvent.setup();
    const identityCode = '396112341234';
    const backend = smartIdAuthenticationBackend(server, { challengeCode: '1928', identityCode });
    expect(await screen.findByText('Log in')).toBeInTheDocument();
    await user.click(screen.getByText(/Smart-ID/gi));
    await user.type(screen.getByPlaceholderText(/Identity code/gi), identityCode);
    await user.click(screen.getByText(/Log in$/gi));
    expect(await screen.findByText('1928')).toBeInTheDocument();
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('they can sign in with mobile id, showing the security code', async () => {
    const user = userEvent.setup();
    const identityCode = '396112341234';
    const phoneNumber = '+372123456789';
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      identityCode,
      phoneNumber,
    });
    expect(await screen.findByText('Log in')).toBeInTheDocument();
    await user.click(screen.getByText(/Mobile-ID/gi));
    await user.type(screen.getByPlaceholderText(/Identity code/gi), identityCode);
    await user.type(screen.getByPlaceholderText(/Phone number/gi), phoneNumber);
    await user.click(screen.getByText(/Log in$/gi));
    expect(await screen.findByText('4321')).toBeInTheDocument();
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('they can sign in with id card', async () => {
    const user = userEvent.setup();
    const backend = idCardAuthenticationBackend(server);
    expect(backend.acceptedCertificate).toBeFalsy();
    expect(backend.authenticatedWithIdCard).toBeFalsy();
    expect(await screen.findByText('Log in')).toBeInTheDocument();
    await user.click(screen.getByText(/ID-card/gi));
    await user.click(screen.getByText(/Log in$/gi));

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    // ALB mTLS: no preliminary GET request, so acceptedCertificate remains false
    expect(backend.acceptedCertificate).toBeFalsy();
    expect(backend.authenticatedWithIdCard).toBeTruthy();
  });
});
