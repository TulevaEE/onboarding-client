import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';

import { TransactionDetailPage } from './TransactionDetailPage';
import { fundsBackend } from '../../../test/backend';
import { initializeConfiguration } from '../../config/config';
import { getAuthentication } from '../../common/authenticationManager';
import { anAuthenticationManager } from '../../common/authenticationManagerFixture';
import { Transaction } from '../../common/apiModels';

jest.mock('react-redux');

describe('TransactionDetailPage', () => {
  const server = setupServer();

  function initializeComponent(transactionId: string) {
    render(
      <IntlProvider
        locale="en"
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
  });

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
        isin: 'EE0000003283',
        type: 'CONTRIBUTION_CASH',
        units: 2000,
        nav: 1,
      },
    ]);

    initializeComponent('tkf100-tx');

    expect(await screen.findByText(/1\.0000\s*€/)).toBeInTheDocument();
  });
});
