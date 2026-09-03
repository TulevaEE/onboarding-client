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

  test('they can sign in with smart id by scanning the QR code', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    expect(await screen.findByRole('button', { name: 'Log in with Smart-ID' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Identity code/gi)).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Log in with Smart-ID' }));

    expect(
      await screen.findByRole('img', { name: /Open the Smart-ID app on your phone/ }),
    ).toBeInTheDocument();
    expect(backend.startedSessions).toBe(1);

    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('they can continue with a push notification when the browser remembers their Smart-ID account', async () => {
    const backend = smartIdAuthenticationBackend(server, {
      rememberedAccount: { firstName: 'Mari', lastName: 'Maasikas' },
      verificationCode: '5678',
    });

    userEvent.click(await screen.findByRole('button', { name: 'Continue as Mari' }));

    expect(await screen.findByText('5678')).toBeInTheDocument();
    expect(backend.startedFlows).toEqual(['NOTIFICATION']);

    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('somebody else can switch from the remembered account to the QR code', async () => {
    const backend = smartIdAuthenticationBackend(server, {
      rememberedAccount: { firstName: 'Mari', lastName: 'Maasikas' },
    });
    expect(await screen.findByRole('button', { name: 'Continue as Mari' })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /Not you/ }));

    expect(
      await screen.findByRole('img', { name: /Open the Smart-ID app on your phone/ }),
    ).toBeInTheDocument();
    expect(backend.rememberedAccount).toBeNull();
    expect(backend.startedFlows).toEqual(['DEVICE_LINK']);
  });

  test('they can sign in with mobile id, showing the security code', async () => {
    const identityCode = '396112341234';
    const phoneNumber = '+372123456789';
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      identityCode,
      phoneNumber,
    });
    expect(await screen.findByRole('button', { name: 'Log in with Smart-ID' })).toBeInTheDocument();
    userEvent.click(screen.getByText(/Mobile-ID/gi));
    userEvent.type(screen.getByPlaceholderText(/Identity code/gi), identityCode);
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), phoneNumber);
    userEvent.click(screen.getByText(/Log in$/gi));
    expect(await screen.findByText('4321')).toBeInTheDocument();
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('a failed Mobile-ID login explains what happened and stays on the Mobile-ID tab', async () => {
    mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      failWith: 'mobile.id.timeout',
    });
    expect(await screen.findByRole('button', { name: 'Log in with Smart-ID' })).toBeInTheDocument();
    userEvent.click(screen.getByText(/Mobile-ID/gi));
    userEvent.type(screen.getByPlaceholderText(/Identity code/gi), '38888888888');
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '+37255512345');
    userEvent.click(screen.getByText(/Log in$/gi));
    expect(await screen.findByText('4321')).toBeInTheDocument();

    expect(
      await screen.findByText(/Mobile-ID did not get a confirmation in time/, undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Phone number/gi)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Mobile-ID' })).toHaveClass('active');
  });

  test('they can sign in with id card via mTLS escape hatch (?mtls=true)', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?mtls=true' },
      writable: true,
      configurable: true,
    });

    const backend = idCardAuthenticationBackend(server);
    expect(backend.acceptedCertificate).toBeFalsy();
    expect(backend.authenticatedWithIdCard).toBeFalsy();
    expect(await screen.findByRole('button', { name: 'Log in with Smart-ID' })).toBeInTheDocument();
    userEvent.click(screen.getByText(/ID-card/gi));
    userEvent.click(screen.getByText(/Log in$/gi));

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(backend.acceptedCertificate).toBeFalsy();
    expect(backend.authenticatedWithIdCard).toBeTruthy();
  });
});
