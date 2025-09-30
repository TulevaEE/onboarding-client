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

  it('validates the deposit amount', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Deposit to additional savings fund' }),
    ).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    const submitButton = screen.getByRole('button', { name: 'Continue' });
    const validationMessage = 'The deposit amount must be at least one euro.';

    expect(amountInput).toBeInTheDocument();
    expect(submitButton).toBeDisabled(); // Disabled until form is touched

    // Trigger minimum amount validation
    userEvent.type(amountInput, '-1');
    userEvent.click(submitButton); // Trigger validation by clicking away from input
    expect(await screen.findByText(validationMessage)).toBeInTheDocument();

    // Trigger required field validation
    userEvent.clear(amountInput);
    userEvent.click(submitButton); // Trigger validation by clicking away from input
    expect(await screen.findByText(validationMessage)).toBeInTheDocument();

    // Enter valid amount
    userEvent.type(amountInput, '123.45');
    userEvent.click(submitButton); // Trigger validation by clicking away from input
    expect(amountInput).toHaveValue('123.45');
    await waitFor(() => expect(screen.queryByText(validationMessage)).not.toBeInTheDocument());

    await waitFor(() => expect(submitButton).toBeEnabled());
  });

  it('lets user select a bank and start the payment', async () => {
    expect(
      await screen.findByRole('heading', { name: 'Deposit to additional savings fund' }),
    ).toBeInTheDocument();

    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    const submitButton = screen.getByRole('button', { name: 'Continue' });
    userEvent.type(amountInput, '123.45');

    const lhvRadio = screen.getByRole('radio', { name: 'LHV' });
    userEvent.click(lhvRadio);
    expect(lhvRadio).toBeChecked();
    await waitFor(() => expect(submitButton).toBeEnabled());
    userEvent.click(submitButton);

    await waitFor(() =>
      expect(windowLocation).toHaveBeenCalledWith(
        'https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with.123.45.EUR.LHV',
      ),
    );
    expect(windowLocation).toHaveBeenCalledTimes(1);
  });
});
