import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { Route } from 'react-router-dom';
import { createMemoryHistory, MemoryHistory } from 'history';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import {
  applicationsBackend,
  savingsAccountStatementBackend,
  transactionsBackend,
  useTestBackendsExcept,
  userBackend,
} from '../../test/backend';
import { contribution } from './TransactionSection/fixtures';
import { additionalSavingsFund } from './statusBox/fixtures';
import { savingFundPaymentApplication } from './ApplicationSection/fixtures';

const server = setupServer();

let history: MemoryHistory;

function initializeComponent() {
  history = createMemoryHistory();
  const store = createDefaultStore(history);
  login(store);
  renderWrapped(<Route path="" component={LoggedInApp} />, history, store);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('RepresentedPartyAccountPage', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, {
      role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'Acme OÜ' },
    });
    transactionsBackend(server, [contribution]);
    savingsAccountStatementBackend(server, {
      ...additionalSavingsFund,
      value: 5000,
      contributions: 4500,
      profit: 500,
      units: 1000,
    });
    applicationsBackend(server, [savingFundPaymentApplication]);
    initializeComponent();
    history.push('/account');
  });

  test('greets the company representative', async () => {
    expect(await screen.findByText('Hi, Acme OÜ representative')).toBeInTheDocument();
  });

  test('renders savings fund overview with deposit and withdraw links', async () => {
    expect(await screen.findByText(additionalSavingsFund.fund.name)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Deposit' })).toHaveAttribute(
      'href',
      '/savings-fund/payment',
    );
    expect(screen.getByRole('link', { name: 'Withdraw' })).toHaveAttribute(
      'href',
      '/savings-fund/withdraw',
    );
  });

  test('shows the savings fund profit next to its balance', async () => {
    expect(await screen.findByText(additionalSavingsFund.fund.name)).toBeInTheDocument();
    // The savings fund row now includes a profit ("Tulu") cell alongside the balance.
    expect(await screen.findByText(/^500\.00\s€$/)).toBeInTheDocument();
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

  test('renders pending savings fund applications', async () => {
    expect(await screen.findByText('Pending applications and transactions')).toBeInTheDocument();
    expect(screen.getByText(/deposit to Additional Savings Fund/)).toBeInTheDocument();
  });

  test('does not show a third pillar section for a represented company', async () => {
    expect(await screen.findByText(additionalSavingsFund.fund.name)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /III\spillar/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Tuleva III Samba Pensionifond')).not.toBeInTheDocument();
  });
});

describe('RepresentedPartyAccountPage for a represented child', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, {
      role: { type: 'PERSON', code: '61508110000', name: 'Kid Doe' },
    });
    savingsAccountStatementBackend(server);
    initializeComponent();
    history.push('/account');
  });

  test("shows the child's third pillar holdings", async () => {
    expect(
      await screen.findByRole('heading', { name: /III\spillar/, level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tuleva III Samba Pensionifond')).toBeInTheDocument();
  });

  test('does not show second pillar funds for the child', async () => {
    expect(
      await screen.findByRole('heading', { name: /III\spillar/, level: 3 }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Tuleva World Stocks Pension Fund')).not.toBeInTheDocument();
    expect(screen.queryByText('Swedbank Pension Fund K60')).not.toBeInTheDocument();
  });
});

describe('RepresentedPartyAccountPage without savings fund balance', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, {
      role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'Acme OÜ' },
    });
    savingsAccountStatementBackend(server);
    initializeComponent();
    history.push('/account');
  });

  test('renders deposit link even without balance data', async () => {
    expect(await screen.findByRole('link', { name: 'Deposit' })).toHaveAttribute(
      'href',
      '/savings-fund/payment',
    );
  });
});

describe('RepresentedPartyAccountPage with zero balance', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, {
      role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'Acme OÜ' },
    });
    savingsAccountStatementBackend(server, additionalSavingsFund);
    initializeComponent();
    history.push('/account');
  });

  test('renders savings fund table with zero balance', async () => {
    expect(
      await screen.findByText(new RegExp(additionalSavingsFund.fund.name)),
    ).toBeInTheDocument();
    // Profit and value cells both render 0.00 € for a zero-balance fund.
    expect(screen.getAllByText(/0.00\s€/)).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Deposit' })).toHaveAttribute(
      'href',
      '/savings-fund/payment',
    );
  });
});

describe('RepresentedPartyAccountPage while the savings balance is loading', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, {
      role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'Acme OÜ' },
    });
    server.use(
      rest.get('http://localhost/v1/savings-account-statement', (_req, res, ctx) =>
        res(ctx.delay('infinite')),
      ),
    );
    initializeComponent();
    history.push('/account');
  });

  test('shows a shimmer in place of an empty savings table', async () => {
    expect(await screen.findByText('Hi, Acme OÜ representative')).toBeInTheDocument();
    expect(await screen.findByTestId('account-statement-loader')).toBeInTheDocument();
    expect(screen.queryByText(/0.00\s€/)).not.toBeInTheDocument();
  });
});
