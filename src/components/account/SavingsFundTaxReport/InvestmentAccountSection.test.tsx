import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { InvestmentAccountSection } from './InvestmentAccountSection';

const IBAN = 'EE471000001020145685';

const server = setupServer();

const declared: string[] = [];

const investmentAccountBackend = (iban: string | null) =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) =>
      res(ctx.json({ iban })),
    ),
    rest.put('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) => {
      const { iban: declaredIban } = req.body as { iban: string };
      declared.push(declaredIban);
      return res(ctx.json({ iban: declaredIban }));
    }),
  );

const investmentAccountBackendRefusing = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) =>
      res(ctx.json({ iban: null })),
    ),
    rest.put('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) =>
      res(ctx.status(400), ctx.json({ errors: [{ code: 'investmentAccount.iban.invalid' }] })),
    ),
  );

function initializeComponent() {
  const history = createMemoryHistory();
  const store = createDefaultStore(history as any);
  login(store);

  renderWrapped(
    <InvestmentAccountSection />,
    history as any,
    store,
    new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }),
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  declared.length = 0;
});

describe('the investment account someone can declare', () => {
  it('starts empty when nothing was declared', async () => {
    investmentAccountBackend(null);
    initializeComponent();

    expect(await screen.findByLabelText(/Investment account IBAN/)).toHaveValue('');
  });

  it('shows the account that was declared', async () => {
    investmentAccountBackend(IBAN);
    initializeComponent();

    const field = await screen.findByLabelText(/Investment account IBAN/);

    await waitFor(() => expect(field).toHaveValue(IBAN));
  });

  it('sends a newly typed account to the backend', async () => {
    investmentAccountBackend(null);
    initializeComponent();

    userEvent.type(await screen.findByLabelText(/Investment account IBAN/), IBAN);
    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(declared).toEqual([IBAN]));
  });

  it('says so when the backend will not take the account number', async () => {
    investmentAccountBackendRefusing();
    initializeComponent();

    userEvent.type(await screen.findByLabelText(/Investment account IBAN/), 'EE001');
    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/not a valid account number/i);
  });
});
