import { Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { createMemoryHistory, History } from 'history';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SavingsFundWithdraw } from './SavingsFundWithdraw';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import LoggedInApp from '../../../LoggedInApp';
import { initializeConfiguration } from '../../../config/config';
import { useTestBackends } from '../../../../test/backend';
import { SourceFund } from '../../../common/apiModels';

const mockSavingsFundBalance: SourceFund = {
  fundManager: { name: 'Tuleva' },
  activeFund: true,
  name: 'Tuleva Additional Savings Fund',
  pillar: null,
  managementFeePercent: 0.34,
  isin: 'EE3600001707',
  price: 1000.5,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0043,
  contributions: 900,
  subtractions: 0,
  profit: 100.5,
  units: 128.14,
};

const mockBankAccounts = ['EE362200221234567897', 'EE362200221098765432'];

describe(SavingsFundWithdraw, () => {
  const server = setupServer();
  let history: History;

  const initApp = () => {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  };

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(async () => {
    initializeConfiguration();
    useTestBackends(server);

    server.use(
      rest.get('http://localhost/v1/savings/onboarding/status', (_req, res, ctx) =>
        res(ctx.json({ status: 'COMPLETED' })),
      ),
      rest.get('http://localhost/v1/savings-account-statement', (_req, res, ctx) =>
        res(
          ctx.json({
            fund: {
              fundManager: { name: 'Tuleva' },
              isin: 'EE3600001707',
              name: 'Tuleva Additional Savings Fund',
              managementFeeRate: 0.0034,
              pillar: null,
              status: 'ACTIVE',
              inceptionDate: '2017-01-01',
              nav: 7.81,
            },
            value: mockSavingsFundBalance.price,
            unavailableValue: 0,
            currency: 'EUR',
            activeContributions: true,
            contributions: mockSavingsFundBalance.contributions,
            subtractions: mockSavingsFundBalance.subtractions,
            profit: mockSavingsFundBalance.profit,
            units: mockSavingsFundBalance.units,
          }),
        ),
      ),
      rest.get('http://localhost/v1/savings/bank-accounts', (_req, res, ctx) =>
        res(ctx.json(mockBankAccounts)),
      ),
    );

    initApp();
    history.push('/savings-fund/withdraw');
  });

  it('validates the withdrawal amount and bank account selection', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Withdraw from additional savings fund' }),
    ).toBeInTheDocument();

    const amountInput = await screen.findByRole('textbox', { name: 'Amount' });
    const submitButton = screen.getByRole('button', { name: 'Continue' });
    const amountValidationMessage = 'The withdrawal amount must be at least one euro.';
    const bankAccountValidationMessage = 'Please select a bank account';

    expect(amountInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();

    const bankAccountSelect = await screen.findByRole('combobox', { name: 'Bank account' });
    expect(bankAccountSelect).toBeInTheDocument();

    userEvent.click(submitButton);
    expect(await screen.findByText(amountValidationMessage)).toBeInTheDocument();

    userEvent.type(amountInput, '0.5');
    userEvent.click(submitButton);
    expect(await screen.findByText(amountValidationMessage)).toBeInTheDocument();

    userEvent.clear(amountInput);
    userEvent.type(amountInput, '123.45');
    userEvent.click(submitButton);
    await waitFor(() =>
      expect(screen.queryByText(amountValidationMessage)).not.toBeInTheDocument(),
    );

    expect(await screen.findByText(bankAccountValidationMessage)).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
  });

  it('displays balance slider with correct range', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Withdraw from additional savings fund' }),
    ).toBeInTheDocument();

    const slider = await screen.findByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', mockSavingsFundBalance.price.toString());

    expect(screen.getByText('0 €')).toBeInTheDocument();
    expect(screen.getByText(/1\s*000[,.]50\s*€/)).toBeInTheDocument();
  });

  it('populates bank account dropdown with available accounts', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Withdraw from additional savings fund' }),
    ).toBeInTheDocument();

    const bankAccountSelect = await screen.findByRole('combobox', { name: 'Bank account' });
    expect(bankAccountSelect).toBeInTheDocument();

    expect(await screen.findByRole('option', { name: mockBankAccounts[0] })).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(mockBankAccounts.length + 1);

    expect(screen.getByRole('option', { name: 'Select bank account' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: mockBankAccounts[0] })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: mockBankAccounts[1] })).toBeInTheDocument();
  });

  it('submits withdrawal request successfully', async () => {
    let withdrawalRequested = false;
    let submittedData: any = null;

    server.use(
      rest.post('http://localhost/v1/savings/redemptions', async (_req, res, ctx) => {
        if (_req.headers.get('Authorization') !== 'Bearer an access token') {
          return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
        }
        withdrawalRequested = true;
        submittedData = _req.body;
        return res(ctx.status(200));
      }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Withdraw from additional savings fund' }),
    ).toBeInTheDocument();

    const amountInput = await screen.findByRole('textbox', { name: 'Amount' });
    const bankAccountSelect = await screen.findByRole('combobox', { name: 'Bank account' });
    expect(await screen.findByRole('option', { name: mockBankAccounts[0] })).toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: 'Continue' });

    userEvent.type(amountInput, '250.75');
    userEvent.selectOptions(bankAccountSelect, mockBankAccounts[0]);
    userEvent.click(submitButton);

    const confirmButton = await screen.findByRole('button', { name: 'Confirm' });
    expect(screen.getByText('250.75 €')).toBeInTheDocument();
    userEvent.click(confirmButton);

    await waitFor(() => expect(withdrawalRequested).toBe(true));
    expect(submittedData).toEqual({
      amount: 250.75,
      currency: 'EUR',
      iban: mockBankAccounts[0],
    });
    expect(history.location.pathname).toBe('/savings-fund/withdraw/success');
  });

  it('displays error message when withdrawal fails', async () => {
    server.use(
      rest.post('http://localhost/v1/savings/redemptions', (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'Server error' })),
      ),
    );

    expect(
      await screen.findByRole('heading', { name: 'Withdraw from additional savings fund' }),
    ).toBeInTheDocument();

    const amountInput = await screen.findByRole('textbox', { name: 'Amount' });
    const bankAccountSelect = await screen.findByRole('combobox', { name: 'Bank account' });
    expect(await screen.findByRole('option', { name: mockBankAccounts[0] })).toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: 'Continue' });

    userEvent.type(amountInput, '100');
    userEvent.selectOptions(bankAccountSelect, mockBankAccounts[0]);
    userEvent.click(submitButton);

    const confirmButton = await screen.findByRole('button', { name: 'Confirm' });
    userEvent.click(confirmButton);

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/There was an error processing your withdrawal request/i);
  });

  it('displays cancel button that navigates to account page', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Withdraw from additional savings fund' }),
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole('link', { name: 'Back' });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveAttribute('href', '/account');
  });

  it('displays info section with withdraw variant', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Withdraw from additional savings fund' }),
    ).toBeInTheDocument();

    expect(
      screen.getByText('You can only withdraw to a bank account in your name.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Making a withdrawal is free.')).toBeInTheDocument();
  });

  it('enforces maximum withdrawal amount', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Withdraw from additional savings fund' }),
    ).toBeInTheDocument();

    const amountInput = await screen.findByRole('textbox', { name: 'Amount' });
    expect(await screen.findByRole('slider')).toBeInTheDocument();
    userEvent.type(amountInput, '5000');

    await waitFor(() => {
      expect(amountInput).toHaveValue(mockSavingsFundBalance.price.toString());
    });
  });

  it('accepts comma as decimal separator', async () => {
    let submittedData: any = null;

    server.use(
      rest.post('http://localhost/v1/savings/redemptions', async (_req, res, ctx) => {
        submittedData = _req.body;
        return res(ctx.status(200));
      }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Withdraw from additional savings fund' }),
    ).toBeInTheDocument();

    const amountInput = await screen.findByRole('textbox', { name: 'Amount' });
    const bankAccountSelect = await screen.findByRole('combobox', { name: 'Bank account' });
    expect(await screen.findByRole('option', { name: mockBankAccounts[0] })).toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: 'Continue' });

    userEvent.type(amountInput, '123,45');
    userEvent.selectOptions(bankAccountSelect, mockBankAccounts[0]);
    userEvent.click(submitButton);

    const confirmButton = await screen.findByRole('button', { name: 'Confirm' });
    userEvent.click(confirmButton);

    await waitFor(() => expect(submittedData).toBeTruthy());
    expect(submittedData.amount).toBe(123.45);
    expect(history.location.pathname).toBe('/savings-fund/withdraw/success');
  });
});
