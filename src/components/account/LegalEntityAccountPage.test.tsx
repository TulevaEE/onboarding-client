import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { useTestBackendsExcept, userBackend } from '../../test/backend';

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

describe('LegalEntityAccountPage', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, {
      role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'Acme OÜ' },
    });
    server.use(
      rest.get('http://localhost/v1/savings/onboarding/status', (req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
      rest.get('http://localhost/v1/savings-account-statement', (req, res, ctx) =>
        res(
          ctx.json({
            fund: {
              fundManager: { name: 'Tuleva' },
              isin: 'EE_SAVINGS',
              name: 'Tuleva Savings Fund',
              managementFeeRate: 0.003,
              pillar: null,
              ongoingChargesFigure: 0.003,
              status: 'ACTIVE',
            },
            value: 5000,
            unavailableValue: 0,
            currency: 'EUR',
            activeContributions: true,
            contributions: 4500,
            subtractions: 0,
            profit: 500,
            units: 1000,
          }),
        ),
      ),
    );
    initializeComponent();
    history.push('/account');
  });

  test('renders a greeting with company name', async () => {
    expect(await screen.findByText(/Hi, Acme OÜ/)).toBeInTheDocument();
    expect(screen.queryByText('john.doe@example.com')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /update contact/i })).not.toBeInTheDocument();
  });

  test('renders savings fund status row without separator border', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Additional savings fund', level: 3 }),
    ).toBeInTheDocument();
    const statusRow = screen.getByTestId('status-box-row');
    expect(statusRow).not.toHaveClass('tv-table__row');
  });

  test('renders savings fund table', async () => {
    expect(await screen.findByText('Tuleva Savings Fund')).toBeInTheDocument();
  });

  test('renders last transactions with link to savings fund transactions', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Your latest transactions', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all transactions' })).toHaveAttribute(
      'href',
      '/savings-fund-transactions',
    );
  });

  test('renders savings fund deposit and withdraw links', async () => {
    expect(await screen.findByRole('link', { name: 'Deposit' })).toHaveAttribute(
      'href',
      '/savings-fund/payment',
    );
    expect(screen.getByRole('link', { name: 'Withdraw' })).toHaveAttribute(
      'href',
      '/savings-fund/withdraw',
    );
  });
});
