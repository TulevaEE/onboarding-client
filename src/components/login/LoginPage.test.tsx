import React from 'react';
import { setupServer } from 'msw/node';
import { screen, act, waitFor } from '@testing-library/react';
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

const setPageVisibility = (visibility: 'visible' | 'hidden') =>
  Object.defineProperty(document, 'visibilityState', { value: visibility, configurable: true });

describe('When a user is logging in', () => {
  const server = setupServer();
  let history: History;

  function initializeComponent() {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);

    renderWrapped(
      <Switch>
        <Route exact path="/account" render={() => <h1>Mock account page</h1>} />
        <Route exact path="/capital" render={() => <h1>Mock deep link page</h1>} />
        <Route exact path={loginPath} component={LoginPage} />
      </Switch>,
      history as any,
      store,
    );
  }
  beforeEach(() => {
    localStorage.clear();
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
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Identity code/gi)).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    expect(backend.startedSessions).toBe(1);

    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  test('a Smart-ID login is not remembered on this browser unless they ask for it', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    expect(await screen.findByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();

    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    expect(backend.deviceLinkRememberMeChoices).toEqual([false]);
  });

  test('a Smart-ID login is remembered on this browser when they ask for it', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('checkbox', { name: 'Remember me' }));

    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));

    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    expect(backend.deviceLinkRememberMeChoices).toEqual([true]);
  });

  test('they sign in by scanning the QR code of the session that silently replaced an expired one', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    const sessionStart = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
    try {
      await waitFor(() => expect(backend.startedSessions).toBe(2), { timeout: 3000 });
      expect(
        await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
      ).toBeInTheDocument();

      backend.resolvePolling();
      expect(
        await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
      ).toBeInTheDocument();
    } finally {
      now.mockRestore();
    }
  });

  test('the session that silently replaces an expired QR code keeps their choice to be remembered', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('checkbox', { name: 'Remember me' }));
    userEvent.click(screen.getByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    const sessionStart = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
    try {
      await waitFor(() => expect(backend.startedSessions).toBe(2), { timeout: 3000 });
      expect(backend.deviceLinkRememberMeChoices).toEqual([true, true]);
    } finally {
      now.mockRestore();
    }
  });

  test('an expired QR code stays until they act, even after the session it showed times out', async () => {
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();

    setPageVisibility('hidden');
    const sessionStart = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => sessionStart + 61000);
    try {
      expect(
        await screen.findByText('The QR code expired.', undefined, { timeout: 3000 }),
      ).toBeInTheDocument();

      backend.failPollingWith('smart.id.timeout');
      await act(() => new Promise((resolve) => setTimeout(resolve, 1500)));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('The QR code expired.')).toBeInTheDocument();
    } finally {
      now.mockRestore();
      setPageVisibility('visible');
    }
  });

  test('they land on the page they came for, without the login landing flag', async () => {
    act(() => {
      history.replace('/login', { from: '/capital' });
    });
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock deep link page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toBeUndefined();
  });

  test('they land on the account page with the landing flag when they came from the app root', async () => {
    act(() => {
      history.replace('/login', { from: '/' });
    });
    const backend = smartIdAuthenticationBackend(server, { language: 'en' });
    userEvent.click(await screen.findByRole('button', { name: /^Log in$/ }));
    expect(
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(history.location.state).toEqual({ justLoggedIn: true });
  });

  test('they can continue with a push notification when the browser remembers their Smart-ID account', async () => {
    const backend = smartIdAuthenticationBackend(server, {
      rememberedAccount: { firstName: 'Mari', lastName: 'Maasikas' },
      verificationCode: '5678',
    });

    userEvent.click(await screen.findByRole('button', { name: 'Continue as Mari' }));

    expect(await screen.findByText('5678')).toBeInTheDocument();
    expect(screen.getByText(/In the Smart.ID app, choose this code:/)).toBeInTheDocument();
    expect(screen.getByText(/Make sure the request says Tuleva/)).toBeInTheDocument();
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
      await screen.findByRole('img', { name: /^Scan with the Smart.ID app$/ }),
    ).toBeInTheDocument();
    expect(backend.rememberedAccount).toBeNull();
    expect(backend.startedFlows).toEqual(['DEVICE_LINK']);
  });

  test('they can sign in with mobile id typing the number as they like, showing the security code', async () => {
    const identityCode = '38001085718';
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      identityCode,
      phoneNumber: '+37255512345',
    });
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    userEvent.click(screen.getByText(/Mobile-ID/gi));
    await waitFor(() => expect(screen.getByPlaceholderText(/Identity code/gi)).toHaveFocus());
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), identityCode);
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '5551 2345');
    userEvent.click(screen.getByText(/Log in$/gi));
    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(
      screen.getByText(/Make sure that the verification code received on your phone is the same/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Make sure the request says Tuleva/)).toBeInTheDocument();
    expect(backend.startedLogins).toEqual([
      { personalCode: identityCode, phoneNumber: '+37255512345', rememberMe: false },
    ]);
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('a Mobile-ID login remembers the number on this browser when they ask for it', async () => {
    const backend = mobileIdAuthenticationBackend(server, { challengeCode: '4321' });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '+37255512345');
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();

    userEvent.click(screen.getByRole('checkbox', { name: 'Remember me' }));
    userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(backend.startedLogins).toEqual([
      { personalCode: '38001085718', phoneNumber: '+37255512345', rememberMe: true },
    ]);
  });

  test('a person whose Mobile-ID number the service remembers logs in with only the identity code', async () => {
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      rememberedPersonalCodes: ['38001085718'],
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');

    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/Phone number/gi)).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();
    userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(backend.startedLogins).toEqual([{ personalCode: '38001085718', rememberMe: true }]);
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('a person this browser remembers for Mobile-ID logs in as their first name without typing anything', async () => {
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      rememberedPerson: { firstName: 'Aadu' },
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));

    userEvent.click(await screen.findByRole('button', { name: 'Continue as Aadu' }));

    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(backend.rememberedPersonLogins).toBe(1);
    expect(backend.startedLogins).toEqual([]);
    backend.resolvePolling();
    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('somebody else on a browser that remembers a Mobile-ID person gets the empty form after Not you', async () => {
    const backend = mobileIdAuthenticationBackend(server, {
      rememberedPerson: { firstName: 'Aadu' },
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));

    userEvent.click(await screen.findByRole('button', { name: 'Not you?' }));

    expect(await screen.findByPlaceholderText(/Identity code/gi)).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();
    expect(screen.queryByText(/Aadu/)).not.toBeInTheDocument();
    expect(backend.rememberedPerson).toBeNull();
    expect(backend.rememberedPersonLogins).toBe(0);
  });

  test('a remembered number that no longer works brings back the phone field', async () => {
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      rememberedPersonalCodes: ['38001085718'],
      rememberedNumberStopsWorking: true,
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/Phone number/gi)).not.toBeInTheDocument(),
    );

    userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    const phoneField = await screen.findByPlaceholderText(/Phone number/gi);
    expect(phoneField).toHaveFocus();
    expect(screen.getByText('Enter your current phone number.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    userEvent.type(phoneField, '+37255512345');
    userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(backend.startedLogins).toEqual([
      { personalCode: '38001085718', rememberMe: true },
      { personalCode: '38001085718', phoneNumber: '+37255512345', rememberMe: false },
    ]);
  });

  test('a number typed before the identity code is used without asking whether one is remembered', async () => {
    const backend = mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      rememberedPersonalCodes: ['38001085718'],
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Phone number/gi), '+37255512345');
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');

    userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('4321')).toBeInTheDocument();
    expect(backend.rememberedLookups).toEqual([]);
    expect(backend.startedLogins).toEqual([
      { personalCode: '38001085718', phoneNumber: '+37255512345', rememberMe: false },
    ]);
  });

  test('a failed Mobile-ID login explains what happened and stays on the Mobile-ID tab', async () => {
    mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      failWith: 'mobile.id.timeout',
    });
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    userEvent.click(screen.getByText(/Mobile-ID/gi));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '+37255512345');
    userEvent.click(screen.getByText(/Log in$/gi));
    expect(await screen.findByText('4321')).toBeInTheDocument();

    expect(
      await screen.findByText(/Mobile-ID did not get a confirmation in time/, undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByPlaceholderText(/Phone number/gi)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Mobile-ID' })).toHaveClass('active');
  });

  test('switching to another login method clears the error of a failed one', async () => {
    mobileIdAuthenticationBackend(server, {
      challengeCode: '4321',
      failWith: 'mobile.id.timeout',
    });
    userEvent.click(await screen.findByRole('tab', { name: 'Mobile-ID' }));
    userEvent.type(await screen.findByPlaceholderText(/Identity code/gi), '38001085718');
    userEvent.type(screen.getByPlaceholderText(/Phone number/gi), '+37255512345');
    userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert', undefined, { timeout: 3000 })).toBeInTheDocument();

    userEvent.click(screen.getByRole('tab', { name: 'Smart-ID' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
    expect(await screen.findByRole('button', { name: /^Log in$/ })).toBeInTheDocument();
    userEvent.click(screen.getByText(/ID-card/gi));
    userEvent.click(screen.getByText(/Log in$/gi));

    expect(
      await screen.findByText(/mock account page/gi, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(backend.acceptedCertificate).toBeFalsy();
    expect(backend.authenticatedWithIdCard).toBeTruthy();
  });
});
