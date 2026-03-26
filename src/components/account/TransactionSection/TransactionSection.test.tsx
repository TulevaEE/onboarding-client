import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { IntlProvider } from 'react-intl';
import { TransactionSection } from './TransactionSection';
import { contribution } from './fixtures';
import { fundsBackend } from '../../../test/backend';
import { initializeConfiguration } from '../../config/config';
import { getAuthentication } from '../../common/authenticationManager';
import { anAuthenticationManager } from '../../common/authenticationManagerFixture';

jest.mock('react-redux');

describe('Transaction section', () => {
  const server = setupServer();

  function initializeComponent(props: { limit?: number; pillar?: number | null } = {}) {
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
        <MemoryRouter>
          <QueryClientProvider client={new QueryClient()}>
            <TransactionSection {...props} />
          </QueryClientProvider>
        </MemoryRouter>
      </IntlProvider>,
    );
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    getAuthentication().update(anAuthenticationManager());
    fundsBackend(server);
  });

  it('does not render at all when there has been an error fetching', async () => {
    server.use(
      rest.get('http://localhost/v1/transactions', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'oh no' })),
      ),
    );
    initializeComponent();
    await waitForRequestToFinish();
    expect(screen.queryByText('transactions.title')).not.toBeInTheDocument();
  });

  it('does not render when transactions are empty and limit is set', async () => {
    mockTransactions([]);
    initializeComponent({ limit: 3 });
    await waitForRequestToFinish();
    expect(screen.queryByText('transactions.title')).not.toBeInTheDocument();
  });

  it('renders pillar page with navigation links even when transactions are empty', async () => {
    mockTransactions([]);
    initializeComponent({ pillar: 2 });
    expect(await screen.findByText('transactions.title')).toBeInTheDocument();
  });

  it('renders the title when there are transactions', async () => {
    mockTransactions([contribution]);
    initializeComponent();
    expect(await screen.findByText('transactions.title')).toBeInTheDocument();
  });

  it('hides type column for savings fund transactions', async () => {
    mockTransactions([
      {
        id: 'sf-1',
        amount: 100,
        currency: 'EUR',
        time: '2024-01-15T10:00:00Z',
        isin: 'EE_SAVINGS',
        type: 'CONTRIBUTION_CASH',
        units: 89,
        nav: 1.12,
      },
    ]);
    initializeComponent();
    expect(await screen.findByText('transactions.title')).toBeInTheDocument();
    expect(screen.queryByText('transactions.columns.entity.title')).not.toBeInTheDocument();
  });

  function waitForRequestToFinish() {
    return new Promise((resolve) => {
      server.on('request:end', () => setTimeout(resolve, 50));
    });
  }

  function mockTransactions(transactions: any[]) {
    server.use(
      rest.get('http://localhost/v1/transactions', (req, res, ctx) => {
        if (req.headers.get('Authorization') !== 'Bearer an access token') {
          return res(ctx.status(401), ctx.json({ error: 'not authenticated correctly' }));
        }
        return res(ctx.status(200), ctx.json(transactions));
      }),
    );
  }
});
