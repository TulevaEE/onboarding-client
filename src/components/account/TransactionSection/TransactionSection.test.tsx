import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { IntlProvider } from 'react-intl';
import { TransactionSection } from './TransactionSection';
import { contribution, subtraction } from './fixtures';
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

  it('shows Osakud column with unit values on full transaction page', async () => {
    mockTransactions([contribution]);
    initializeComponent({ pillar: 2 });
    expect(await screen.findByText('transactions.columns.units.title')).toBeInTheDocument();
    expect(screen.getAllByText('31.36')).toHaveLength(2);
  });

  it('shows unit total in footer when all transactions are from the same fund', async () => {
    const secondContribution = {
      ...contribution,
      id: 'second-id',
      time: '2023-02-15T10:00:00Z',
      amount: 200,
      units: 20.0,
    };
    mockTransactions([contribution, secondContribution]);
    initializeComponent({ pillar: 2 });
    expect(await screen.findByText('transactions.columns.units.title')).toBeInTheDocument();
    expect(screen.getByText('51.36')).toBeInTheDocument();
  });

  it('does not show unit total when transactions are from different funds', async () => {
    mockTransactions([contribution, subtraction]);
    initializeComponent();
    expect(await screen.findByText('transactions.columns.units.title')).toBeInTheDocument();
    expect(screen.getByText('31.36')).toBeInTheDocument();
    expect(screen.queryByText('41.36')).not.toBeInTheDocument();
    expect(screen.queryByText('21.36')).not.toBeInTheDocument();
  });

  it('shows negative units for subtraction transactions', async () => {
    mockTransactions([subtraction]);
    initializeComponent({ pillar: 3 });
    expect(await screen.findByText('transactions.columns.units.title')).toBeInTheDocument();
    expect(screen.getAllByText('−10.00')).toHaveLength(2);
  });

  it('does not show Osakud column when limit is set', async () => {
    mockTransactions([contribution]);
    initializeComponent({ limit: 3 });
    await waitForRequestToFinish();
    expect(screen.queryByText('transactions.columns.units.title')).not.toBeInTheDocument();
  });

  it('makes date a link to transaction detail on full page', async () => {
    mockTransactions([contribution]);
    initializeComponent({ pillar: 2 });
    expect(await screen.findByRole('link', { name: /23/ })).toHaveAttribute(
      'href',
      `/transaction/${contribution.id}`,
    );
  });

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
