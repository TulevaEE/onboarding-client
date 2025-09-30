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

    expect(amountInput).toBeInTheDocument();

    // Trigger minimum amount validation
    userEvent.type(amountInput, '-1');
    userEvent.click(submitButton); // Trigger validation
    expect(
      await screen.findByText('Contribution amount must be at least 1 euro.'),
    ).toBeInTheDocument();

    // Trigger required field validation
    userEvent.clear(amountInput);
    userEvent.click(submitButton); // Trigger validation
    expect(await screen.findByText('Enter an amount.')).toBeInTheDocument();

    // Enter valid amount
    userEvent.type(amountInput, '123.45');
    userEvent.click(submitButton); // Trigger validation
    expect(amountInput).toHaveValue('123.45');
    await waitFor(() => expect(screen.queryByText('Enter an amount.')).not.toBeInTheDocument());
    expect(
      screen.queryByText('Contribution amount must be at least 1 euro.'),
    ).not.toBeInTheDocument();

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
    userEvent.click(lhvRadio);
    expect(lhvRadio).toBeChecked();
    userEvent.click(submitButton);

    await waitFor(() =>
      expect(windowLocation).toHaveBeenCalledWith(
        'https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with.123.45.EUR.LHV',
      ),
    );
    expect(windowLocation).toHaveBeenCalledTimes(1);
  });
});
