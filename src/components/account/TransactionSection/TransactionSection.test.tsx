import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { IntlProvider } from 'react-intl';
import { TransactionSection } from './TransactionSection';
import { contribution, subtraction, transferIn, transferOut } from './fixtures';
import { fundsBackend, userBackend } from '../../../test/backend';
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
    userBackend(server);
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
    expect(screen.getAllByText('31.357')).toHaveLength(2);
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
    expect(screen.getByText('51.357')).toBeInTheDocument();
  });

  it('does not show unit total when transactions are from different funds', async () => {
    mockTransactions([contribution, subtraction]);
    initializeComponent();
    expect(await screen.findByText('transactions.columns.units.title')).toBeInTheDocument();
    expect(screen.getByText('31.357')).toBeInTheDocument();
    expect(screen.queryByText('41.357')).not.toBeInTheDocument();
    expect(screen.queryByText('21.357')).not.toBeInTheDocument();
  });

  it('shows negative units for subtraction transactions', async () => {
    mockTransactions([subtraction]);
    initializeComponent({ pillar: 3 });
    expect(await screen.findByText('transactions.columns.units.title')).toBeInTheDocument();
    expect(screen.getAllByText('−10.000')).toHaveLength(2);
  });

  it('shows negative units for units transferred away and sums both transfers in the footer', async () => {
    mockTransactions([transferIn, transferOut]);
    initializeComponent({ pillar: null });
    expect(await screen.findByText('transactions.columns.units.title')).toBeInTheDocument();
    expect(screen.getByText('100.000')).toBeInTheDocument();
    expect(screen.getByText('−40.000')).toBeInTheDocument();
    expect(screen.getByText('60.000')).toBeInTheDocument();
  });

  const savingsFundContribution = (id: string, units: number) => ({
    ...transferIn,
    id,
    type: 'CONTRIBUTION_CASH',
    units,
    nav: 1.1178,
  });

  it('shows units to three decimals, rounded half up, as the fund rules state', async () => {
    mockTransactions([
      savingsFundContribution('first', 894.61442),
      { ...savingsFundContribution('second', 2.0005), time: '2026-03-12T12:00:00Z' },
    ]);
    initializeComponent({ pillar: null });
    expect(await screen.findByText('894.614')).toBeInTheDocument();
    expect(screen.getByText('2.001')).toBeInTheDocument();
  });

  it('shows the exact units behind a rounded figure on hover', async () => {
    mockTransactions([savingsFundContribution('first', 894.61442)]);
    initializeComponent({ pillar: null });
    expect(await screen.findAllByTitle('894.61442')).toHaveLength(2);
  });

  it('adds the units up from their exact quantities, not from the rounded rows', async () => {
    mockTransactions([
      savingsFundContribution('first', 1.0004),
      { ...savingsFundContribution('second', 1.0004), time: '2026-03-12T12:00:00Z' },
    ]);
    initializeComponent({ pillar: null });
    expect(await screen.findAllByText('1.000')).toHaveLength(2);
    expect(screen.getByText('2.001')).toHaveAttribute('title', '2.0008');
  });

  it('says the units are rounded and the total is exact when a figure was rounded', async () => {
    mockTransactions([savingsFundContribution('first', 894.61442)]);
    initializeComponent({ pillar: null });
    expect(await screen.findByText('units.roundingNote.screen')).toBeInTheDocument();
  });

  it('says nothing about rounding when every figure is shown in full', async () => {
    mockTransactions([contribution]);
    initializeComponent({ pillar: 2 });
    const figures = await screen.findAllByText('31.357');
    figures.forEach((figure) => expect(figure).not.toHaveAttribute('title'));
    expect(screen.queryByText('units.roundingNote.screen')).not.toBeInTheDocument();
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

  it('shows II and III pillar navigation links on the savings fund page when acting as self', async () => {
    mockTransactions([]);
    initializeComponent({ pillar: null });
    expect(await screen.findByText('transactions.title')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'transactions.seeAll.2' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'transactions.seeAll.3' })).toBeInTheDocument();
  });

  it('hides II and III pillar navigation links when representing a company', async () => {
    userBackend(server, { role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'ACME OÜ' } });
    mockTransactions([]);
    initializeComponent({ pillar: null });
    expect(await screen.findByText('transactions.title')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'transactions.seeAll.2' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'transactions.seeAll.3' })).not.toBeInTheDocument();
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
