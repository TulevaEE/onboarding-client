import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { rest } from 'msw';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { useTestBackends } from '../../test/backend';

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

const onboardingStatusHandler = {
  notCompleted: () =>
    rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
      res(ctx.json({ status: null })),
    ),
  completed: () =>
    rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
      res(ctx.json({ status: 'COMPLETED' })),
    ),
};

describe('SavingsFundOnboardingGatekeep', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
  });

  it('redirects /savings-fund/payment to /savings-fund/onboarding when onboarding is not completed', async () => {
    server.use(onboardingStatusHandler.notCompleted());
    initializeComponent();
    history.push('/savings-fund/payment');

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding');
    });
  });

  it('allows access to /savings-fund/payment when onboarding is completed', async () => {
    server.use(onboardingStatusHandler.completed());
    initializeComponent();
    history.push('/savings-fund/payment');

    expect(
      await screen.findByRole('heading', { name: 'Deposit to additional savings fund' }),
    ).toBeInTheDocument();
  });

  it('redirects /savings-fund/withdraw to /savings-fund/onboarding when onboarding is not completed', async () => {
    server.use(onboardingStatusHandler.notCompleted());
    initializeComponent();
    history.push('/savings-fund/withdraw');

    await waitFor(() => {
      expect(history.location.pathname).toBe('/savings-fund/onboarding');
    });
  });
});
