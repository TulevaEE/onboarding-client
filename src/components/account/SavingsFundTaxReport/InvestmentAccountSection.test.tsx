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

const investmentAccountBackendDown = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) =>
      res(ctx.status(500), ctx.json({})),
    ),
  );

const investmentAccountBackendStillAnswering = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) =>
      res(ctx.json({ iban: null })),
    ),
    rest.put('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) => {
      const { iban: declaredIban } = req.body as { iban: string };
      declared.push(declaredIban);
      return res(ctx.delay(100), ctx.json({ iban: declaredIban }));
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

const investmentAccountBackendBroken = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) =>
      res(ctx.json({ iban: IBAN })),
    ),
    rest.put('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) =>
      res(ctx.status(500), ctx.json({})),
    ),
  );

const undeclared: number[] = [];

const investmentAccountBackendAccepting = () =>
  server.use(
    rest.get('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) =>
      res(ctx.json({ iban: IBAN })),
    ),
    rest.delete('http://localhost/v1/savings-fund/investment-account', (req, res, ctx) => {
      undeclared.push(1);
      return res(ctx.json({ iban: null }));
    }),
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
  undeclared.length = 0;
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

  it('does not send the account twice when the button is pressed twice', async () => {
    investmentAccountBackendStillAnswering();
    initializeComponent();

    userEvent.type(await screen.findByLabelText(/Investment account IBAN/), IBAN);
    const save = screen.getByRole('button', { name: 'Save' });
    userEvent.click(save);
    userEvent.click(save);

    await waitFor(() => expect(declared).toEqual([IBAN]));
  });

  it('does not present an empty field as an answer when it could not be loaded', async () => {
    investmentAccountBackendDown();
    initializeComponent();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Investment account IBAN/)).not.toBeInTheDocument();
  });

  it('takes the declaration back when the field is cleared and saved', async () => {
    investmentAccountBackendAccepting();
    initializeComponent();

    const field = await screen.findByLabelText(/Investment account IBAN/);
    await waitFor(() => expect(field).toHaveValue(IBAN));

    userEvent.clear(field);
    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(undeclared).toHaveLength(1));
  });

  it('does not blame the account number when the backend breaks', async () => {
    investmentAccountBackendBroken();
    initializeComponent();

    const field = await screen.findByLabelText(/Investment account IBAN/);
    await waitFor(() => expect(field).toHaveValue(IBAN));

    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not save/i);
    expect(field).not.toHaveAttribute('aria-invalid');
  });

  it('marks the field itself invalid when the account number is refused', async () => {
    investmentAccountBackendRefusing();
    initializeComponent();

    const field = await screen.findByLabelText(/Investment account IBAN/);
    userEvent.type(field, 'EE001');
    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });
});
