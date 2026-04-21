import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
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

describe('LegalEntityAccountPage', () => {
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

  test('renders a greeting with company name', async () => {
    expect(await screen.findByText(/Hi, Acme OÜ/)).toBeInTheDocument();
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
    expect(screen.getByText(/deposit to additional savings fund/)).toBeInTheDocument();
  });
});

describe('LegalEntityAccountPage without savings fund balance', () => {
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

describe('LegalEntityAccountPage with zero balance', () => {
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
    expect(screen.getByText(/0.00\s€/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Deposit' })).toHaveAttribute(
      'href',
      '/savings-fund/payment',
    );
  });
});
