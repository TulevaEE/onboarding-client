import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import {
  paymentRateRedirectBackend,
  useTestBackends,
  useTestBackendsExcept,
} from '../../test/backend';

const server = setupServer();

let history: History;

function initializeComponent() {
  history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => initializeConfiguration());

describe('landing on the account page right after logging in', () => {
  test('redirects to the payment rate page with the nudge state when the server says so', async () => {
    useTestBackendsExcept(server, ['paymentRateRedirect']);
    const requests = paymentRateRedirectBackend(server, {
      redirect: true,
      arm: 'TREATMENT',
      seasonYear: 2026,
    });
    initializeComponent();

    history.push('/account', { justLoggedIn: true });

    await waitFor(() => expect(history.location.pathname).toBe('/2nd-pillar-payment-rate'));
    expect(history.location.state).toEqual({
      nudge: { arm: 'TREATMENT', seasonYear: 2026 },
    });
    expect(requests.count()).toBe(1);
  });

  test('stays on the account page when the server declines', async () => {
    useTestBackendsExcept(server, ['paymentRateRedirect']);
    const requests = paymentRateRedirectBackend(server, { redirect: false });
    initializeComponent();

    history.push('/account', { justLoggedIn: true });

    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
    await waitFor(() => expect(requests.count()).toBe(1));
    expect(history.location.pathname).toBe('/account');
  });

  test('clears the landing flag so a remount asks only once', async () => {
    useTestBackendsExcept(server, ['paymentRateRedirect']);
    const requests = paymentRateRedirectBackend(server, { redirect: false });
    initializeComponent();

    history.push('/account', { justLoggedIn: true });

    await waitFor(() => expect(requests.count()).toBe(1));
    expect(history.location.state).toBeUndefined();
  });
});

describe('navigating to the account page without logging in', () => {
  test('asks for no redirect', async () => {
    useTestBackendsExcept(server, ['paymentRateRedirect']);
    const requests = paymentRateRedirectBackend(server, { redirect: true, arm: 'TREATMENT' });
    initializeComponent();

    history.push('/account');

    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
    expect(requests.count()).toBe(0);
    expect(history.location.pathname).toBe('/account');
  });
});

describe('the default backends', () => {
  test('decline the redirect', async () => {
    useTestBackends(server);
    initializeComponent();

    history.push('/account', { justLoggedIn: true });

    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
    expect(history.location.pathname).toBe('/account');
  });
});
