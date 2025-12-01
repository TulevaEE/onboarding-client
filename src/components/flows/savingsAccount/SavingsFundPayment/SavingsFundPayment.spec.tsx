import { Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { createMemoryHistory, History } from 'history';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SavingsFundPayment } from './SavingsFundPayment';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import LoggedInApp from '../../../LoggedInApp';
import { initializeConfiguration } from '../../../config/config';
import { useTestBackends } from '../../../../test/backend';

describe(SavingsFundPayment, () => {
  const server = setupServer();
  let history: History;
  const user = userEvent.setup();

  const windowLocation = jest.fn();
  Object.defineProperty(window, 'location', {
    value: {
      replace: windowLocation,
    },
  });

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
    initApp();
    history.push('/savings-fund/payment');
  });

  it('validates the deposit amount and bank selection', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Deposit to additional savings fund' }),
    ).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    const submitButton = screen.getByRole('button', { name: 'Continue' });
    const amountValidationMessage = 'The deposit amount must be at least one euro.';
    const bankSelectionValidationMessage = 'Select the bank you want to use for the deposit.';

    expect(amountInput).toBeInTheDocument();

    // Trigger minimum amount validation
    await user.type(amountInput, '-0.5');
    await user.click(submitButton); // Trigger validation
    expect(await screen.findByText(amountValidationMessage)).toBeInTheDocument();

    // Trigger required field validation
    await user.clear(amountInput);
    await user.click(submitButton); // Trigger validation
    expect(await screen.findByText(amountValidationMessage)).toBeInTheDocument();

    // Enter valid amount
    await user.type(amountInput, '123.45');
    await user.click(submitButton); // Trigger validation
    expect(amountInput).toHaveValue('123.45');
    await waitFor(() =>
      expect(screen.queryByText(amountValidationMessage)).not.toBeInTheDocument(),
    );

    expect(screen.getByText(bankSelectionValidationMessage)).toBeInTheDocument();

    expect(submitButton).toBeEnabled();
  });

  it('lets user select a bank and start the payment', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Deposit to additional savings fund' }),
    ).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    const submitButton = screen.getByRole('button', { name: 'Continue' });
    userEvent.type(amountInput, '123.45');

    const lhvRadio = screen.getByRole('radio', { name: 'LHV' });
    await user.click(lhvRadio);
    expect(lhvRadio).toBeChecked();
    await user.click(submitButton);

    await waitFor(() =>
      expect(windowLocation).toHaveBeenCalledWith(
        'https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with.123.45.EUR.LHV',
      ),
    );
    expect(windowLocation).toHaveBeenCalledTimes(1);
  });
});
