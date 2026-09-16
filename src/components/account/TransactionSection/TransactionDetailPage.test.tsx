import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';

import { TransactionDetailPage } from './TransactionDetailPage';
import { fundsBackend, userBackend } from '../../../test/backend';
import { initializeConfiguration } from '../../config/config';
import { getAuthentication } from '../../common/authenticationManager';
import { anAuthenticationManager } from '../../common/authenticationManagerFixture';
import { Transaction } from '../../common/apiModels';
import translations from '../../translations';

jest.mock('react-redux');

describe('TransactionDetailPage', () => {
  const server = setupServer();

  function initializeComponent(transactionId: string) {
    render(
      <IntlProvider
        locale="en"
        messages={translations.en}
        onError={(err) => {
          if (err.code === 'MISSING_TRANSLATION') {
            return;
          }
          throw err;
        }}
      >
        <MemoryRouter initialEntries={[`/transaction/${transactionId}`]}>
          <QueryClientProvider client={new QueryClient()}>
            <Route path="/transaction/:id">
              <TransactionDetailPage />
            </Route>
          </QueryClientProvider>
        </MemoryRouter>
      </IntlProvider>,
    );
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    getAuthentication().update(anAuthenticationManager());
    fundsBackend(server);
    userBackend(server);
  });

  function valueOf(label: string) {
    const labels = screen.getAllByRole('term').map((term) => term.textContent);
    return screen.getAllByRole('definition')[labels.indexOf(label)].textContent;
  }

  function mockTransactions(transactions: Transaction[]) {
    server.use(
      rest.get('http://localhost/v1/transactions', (req, res, ctx) => {
        if (req.headers.get('Authorization') !== 'Bearer an access token') {
          return res(ctx.status(401), ctx.json({ error: 'not authenticated' }));
        }
        return res(ctx.status(200), ctx.json(transactions));
      }),
    );
  }

  it('renders TUV100 NAV with 4 decimals even when JSON drops trailing zero', async () => {
    mockTransactions([
      {
        id: 'tuv100-tx',
        amount: 500,
        currency: 'EUR',
        time: '2026-04-06T16:20:00Z',
        navDate: '2026-04-02',
        priceCalculationDate: null,
        applicationTime: null,
        counterpartyIban: null,
        isin: 'EE3600001707',
        type: 'CONTRIBUTION_CASH',
        units: 407.465,
        nav: 1.266,
      },
    ]);

    initializeComponent('tuv100-tx');

    expect(await screen.findByText(/1\.2660\s*€/)).toBeInTheDocument();
  });

  it('renders TUK75 NAV with 5 decimals even when JSON drops trailing zero', async () => {
    mockTransactions([
      {
        id: 'tuk75-tx',
        amount: 707.01,
        currency: 'EUR',
        time: '2026-04-14T14:57:11Z',
        navDate: '2026-04-11',
        priceCalculationDate: null,
        applicationTime: null,
        counterpartyIban: null,
        isin: 'EE3600109435',
        type: 'CONTRIBUTION_CASH_WORKPLACE',
        units: 500.141,
        nav: 1.431,
      },
    ]);

    initializeComponent('tuk75-tx');

    expect(await screen.findByText(/1\.43100\s*€/)).toBeInTheDocument();
  });

  it('preserves 5-decimal NAV precision for non-Tuleva funds', async () => {
    mockTransactions([
      {
        id: 'swed-tx',
        amount: 100,
        currency: 'EUR',
        time: '2024-05-10T10:00:00Z',
        navDate: '2024-05-09',
        priceCalculationDate: null,
        applicationTime: null,
        counterpartyIban: null,
        isin: 'EE3600019758',
        type: 'CONTRIBUTION_CASH_WORKPLACE',
        units: 68.155,
        nav: 1.46726,
      },
    ]);

    initializeComponent('swed-tx');

    expect(await screen.findByText(/1\.46726\s*€/)).toBeInTheDocument();
  });

  it('pads unlisted-fund NAV to 5 decimals to match pensionikeskus convention', async () => {
    mockTransactions([
      {
        id: 'unknown-tx',
        amount: 100,
        currency: 'EUR',
        time: '2024-05-10T10:00:00Z',
        navDate: '2024-05-09',
        priceCalculationDate: null,
        applicationTime: null,
        counterpartyIban: null,
        isin: 'EE9999999999',
        type: 'CONTRIBUTION_CASH_WORKPLACE',
        units: 80,
        nav: 1.4672,
      },
    ]);

    initializeComponent('unknown-tx');

    expect(await screen.findByText(/1\.46720\s*€/)).toBeInTheDocument();
  });

  it('renders TKF100 NAV with 4 decimals', async () => {
    mockTransactions([
      {
        id: 'tkf100-tx',
        amount: 2000,
        currency: 'EUR',
        time: '2026-02-02T14:56:21Z',
        navDate: '2026-02-01',
        priceCalculationDate: '2026-02-02',
        applicationTime: null,
        counterpartyIban: null,
        isin: 'EE0000003283',
        type: 'CONTRIBUTION_CASH',
        units: 2000,
        nav: 1,
      },
    ]);

    initializeComponent('tkf100-tx');

    expect(await screen.findByText(/1\.0000\s*€/)).toBeInTheDocument();
  });

  it('states everything an execution notice must state for a subscription', async () => {
    mockTransactions([
      {
        id: 'tkf100-subscription',
        amount: 2000,
        currency: 'EUR',
        time: '2026-02-05T14:00:00Z',
        navDate: '2026-02-04',
        priceCalculationDate: '2026-02-05',
        applicationTime: '2026-02-03T11:30:00Z',
        counterpartyIban: 'EE651010220306497226',
        isin: 'EE0000003283',
        type: 'CONTRIBUTION_CASH',
        units: 2000,
        nav: 1,
      },
    ]);

    initializeComponent('tkf100-subscription');

    expect(
      await screen.findByText(/Tuleva Fondid AS, Telliskivi\s*60\/1, 10412\s*Tallinn, Estonia/),
    ).toBeInTheDocument();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(await screen.findByText(/February\s*3,\s*2026 at 13:30/)).toBeInTheDocument();
    expect(
      await screen.findByText(/Bank transfer from account EE65\s1010\s2203\s0649\s7226/),
    ).toBeInTheDocument();
    expect(valueOf('Price calculation date')).toMatch(/^February\s5,\s2026$/);
    expect(valueOf('Execution date')).toMatch(/^February\s5,\s2026$/);
    expect(await screen.findByText(/^0\.00\s*€$/)).toBeInTheDocument();
  });

  it('orders a savings fund notice from what happened to who was involved', async () => {
    mockTransactions([
      {
        id: 'tkf100-ordered',
        amount: 2000,
        currency: 'EUR',
        time: '2026-02-05T14:00:00Z',
        navDate: '2026-02-04',
        priceCalculationDate: '2026-02-05',
        applicationTime: '2026-02-03T11:30:00Z',
        counterpartyIban: 'EE651010220306497226',
        isin: 'EE0000003283',
        type: 'CONTRIBUTION_CASH',
        units: 2000,
        nav: 1,
      },
    ]);

    initializeComponent('tkf100-ordered');

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Type',
      'Fund',
      'Amount',
      'Units',
      'Unit price (NAV)',
      'Price calculation date',
      'Application received',
      'Execution date',
      'Payment method',
      'Subscription and redemption\u00a0fees',
      'Unit holder',
      'Fund manager',
    ]);
  });

  it('keeps a pension fund transaction in the same relative order', async () => {
    mockTransactions([
      {
        id: 'tuk75-ordered',
        amount: 707.01,
        currency: 'EUR',
        time: '2026-04-14T14:57:11Z',
        navDate: '2026-04-11',
        priceCalculationDate: null,
        applicationTime: null,
        counterpartyIban: null,
        isin: 'EE3600109435',
        type: 'CONTRIBUTION_CASH_WORKPLACE',
        units: 500.141,
        nav: 1.431,
      },
    ]);

    initializeComponent('tuk75-ordered');

    expect(await screen.findByText(/1\.43100\s*€/)).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Type',
      'Fund',
      'Amount',
      'Units',
      'Unit price (NAV)',
      'Date',
    ]);
  });

  it('states the application time as the clock time in Estonia', async () => {
    mockTransactions([
      {
        id: 'tkf100-late-order',
        amount: 2000,
        currency: 'EUR',
        time: '2026-02-05T14:00:00Z',
        navDate: '2026-02-04',
        priceCalculationDate: '2026-02-05',
        applicationTime: '2026-02-03T22:30:00Z',
        counterpartyIban: 'EE651010220306497226',
        isin: 'EE0000003283',
        type: 'CONTRIBUTION_CASH',
        units: 2000,
        nav: 1,
      },
    ]);

    initializeComponent('tkf100-late-order');

    expect(await screen.findByText(/February\s*4,\s*2026 at 00:30/)).toBeInTheDocument();
  });

  it('shows the account a redemption was paid to', async () => {
    mockTransactions([
      {
        id: 'tkf100-redemption',
        amount: -500,
        currency: 'EUR',
        time: '2026-02-05T14:00:00Z',
        navDate: '2026-02-04',
        priceCalculationDate: '2026-02-05',
        applicationTime: '2026-02-03T11:30:00Z',
        counterpartyIban: 'EE651010220306497226',
        isin: 'EE0000003283',
        type: 'SUBTRACTION',
        units: 500,
        nav: 1,
      },
    ]);

    initializeComponent('tkf100-redemption');

    expect(
      await screen.findByText(/Bank transfer to account EE65\s1010\s2203\s0649\s7226/),
    ).toBeInTheDocument();
  });

  it('leaves the fund manager and the unit holder out of a pension fund transaction', async () => {
    mockTransactions([
      {
        id: 'tuk75-tx',
        amount: 707.01,
        currency: 'EUR',
        time: '2026-04-14T14:57:11Z',
        navDate: '2026-04-11',
        priceCalculationDate: null,
        applicationTime: null,
        counterpartyIban: null,
        isin: 'EE3600109435',
        type: 'CONTRIBUTION_CASH_WORKPLACE',
        units: 500.141,
        nav: 1.431,
      },
    ]);

    initializeComponent('tuk75-tx');

    expect(await screen.findByText(/1\.43100\s*€/)).toBeInTheDocument();
    expect(screen.queryByText(/Tuleva Fondid AS/)).not.toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });
});
