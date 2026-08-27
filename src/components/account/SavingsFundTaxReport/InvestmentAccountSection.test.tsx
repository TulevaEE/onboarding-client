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
      res(ctx.status(400), ctx.json({ errors: [{ code: 'ValidIban', path: 'iban' }] })),
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

    userEvent.click(await screen.findByRole('button', { name: /I have an investment account/ }));

    expect(screen.getByLabelText(/Investment account IBAN/)).toHaveValue('');
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

    userEvent.click(await screen.findByRole('button', { name: /I have an investment account/ }));
    userEvent.type(screen.getByLabelText(/Investment account IBAN/), IBAN);
    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(declared).toEqual([IBAN]));
  });

  it('says so when the backend will not take the account number', async () => {
    investmentAccountBackendRefusing();
    initializeComponent();

    userEvent.click(await screen.findByRole('button', { name: /I have an investment account/ }));
    userEvent.type(screen.getByLabelText(/Investment account IBAN/), 'EE001');
    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/not a valid account number/i);
  });

  it('does not send the account twice when the button is pressed twice', async () => {
    investmentAccountBackendStillAnswering();
    initializeComponent();

    userEvent.click(await screen.findByRole('button', { name: /I have an investment account/ }));
    userEvent.type(screen.getByLabelText(/Investment account IBAN/), IBAN);
    const save = screen.getByRole('button', { name: 'Save' });
    userEvent.click(save);
    userEvent.click(save);

    await waitFor(() => expect(declared).toEqual([IBAN]));
  });

  it('stays out of the way when nobody has said they have one', async () => {
    investmentAccountBackend(null);
    initializeComponent();

    expect(
      await screen.findByRole('button', { name: /I have an investment account/ }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Investment account IBAN/)).not.toBeInTheDocument();
  });

  it('opens to the account someone already declared, without being asked', async () => {
    investmentAccountBackend(IBAN);
    initializeComponent();

    expect(await screen.findByLabelText(/Investment account IBAN/)).toHaveValue(IBAN);
  });

  it('does not raise an alarm when it could not be loaded', async () => {
    investmentAccountBackendDown();
    initializeComponent();

    expect(
      await screen.findByRole('button', { name: /I have an investment account/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Investment account IBAN/)).not.toBeInTheDocument();
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

    userEvent.click(await screen.findByRole('button', { name: /I have an investment account/ }));
    const field = screen.getByLabelText(/Investment account IBAN/);
    userEvent.type(field, 'EE001');
    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });
});
