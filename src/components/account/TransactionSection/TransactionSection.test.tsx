import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelector } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import config from 'react-global-configuration';
import { QueryClient, QueryClientProvider } from 'react-query';

import { IntlProvider } from 'react-intl';
import { TransactionSection } from './TransactionSection';
import { contribution, subtraction } from './fixtures';
import { fundsBackend } from '../../../test/backend';

jest.mock('react-global-configuration');
jest.mock('react-redux');

describe('Transaction section', () => {
  const server = setupServer();

  function initializeComponent() {
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
            <TransactionSection />
          </QueryClientProvider>
        </MemoryRouter>
      </IntlProvider>,
    );
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    (useSelector as any).mockImplementation((selector: any) =>
      selector({ login: { token: 'mock token' } }),
    );
    (config.get as any).mockImplementation((key: string) => (key === 'language' ? 'en' : null));
    fundsBackend(server);
  });

  it('does not render at all when there are no transactions', async () => {
    mockTransactions([]);
    initializeComponent();
    await waitForRequestToFinish();
    expect(screen.queryByText('transactions.title')).not.toBeInTheDocument();
  });

  it('does not render at all when there has been an error fetching', async () => {
    server.use(
      rest.get('http://localhost/v1/transactions', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'oh no' }));
      }),
    );
    initializeComponent();
    await waitForRequestToFinish();
    expect(screen.queryByText('transactions.title')).not.toBeInTheDocument();
  });

  it('renders the title when there are transactions', async () => {
    mockTransactions([contribution]);
    initializeComponent();
    expect(await screen.findByText('transactions.title')).toBeInTheDocument();
  });

  function waitForRequestToFinish() {
    return new Promise((resolve) => {
      server.on('request:end', () => setTimeout(resolve, 50));
    });
  }

  function mockTransactions(transactions: any[]) {
    server.use(
      rest.get('http://localhost/v1/transactions', (req, res, ctx) => {
        if (req.headers.get('Authorization') !== 'Bearer mock token') {
          return res(ctx.status(401), ctx.json({ error: 'not authenticated correctly' }));
        }
        return res(ctx.status(200), ctx.json(transactions));
      }),
    );
  }
});