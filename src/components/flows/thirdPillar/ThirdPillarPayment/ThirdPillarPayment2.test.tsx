import React from 'react';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import {
  amlChecksBackend,
  fundsBackend,
  paymentLinkBackend,
  pensionAccountStatementBackend,
  userBackend,
  userConversionBackend,
} from '../../../../test/backend';
import { ThirdPillarPayment2 } from './ThirdPillarPayment2';

describe('When a user is making a third pillar payment', () => {
  const server = setupServer();
  let history: History;

  const windowLocation = jest.fn();
  Object.defineProperty(window, 'location', {
    value: {
      replace: windowLocation,
    },
  });

  function initializeComponent() {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);

    renderWrapped(<Route path="" component={ThirdPillarPayment2} />, history as any, store);
  }
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(async () => {
    initializeConfiguration();

    userConversionBackend(server);
    userBackend(server);
    amlChecksBackend(server);
    pensionAccountStatementBackend(server);
    fundsBackend(server);
    paymentLinkBackend(server);

    initializeComponent();

    history.push('/payment');
  });

  test('payment page is being shown', async () => {
    expect(
      await screen.findByText('Payment instructions for Tuleva III pillar pension fund'),
    ).toBeInTheDocument();

    // no cancellation button shown in the card
    expect(screen.queryByText('Cancel application')).not.toBeInTheDocument();
  });

  test('can fill in amount', async () => {
    const amountInput: HTMLInputElement = screen.getByLabelText('What is the payment amount?', {
      exact: false,
    });
    userEvent.type(amountInput, '23');
    expect(amountInput.value).toBe('23');
  });

  test('can select bank', async () => {
    const bankButton: HTMLInputElement = screen.getByLabelText('Swedbank');

    userEvent.click(bankButton);

    expect(bankButton.value).toBe('on');
  });

  test('can start payment', async () => {
    const amountInput = screen.getByLabelText('What is the payment amount?', {
      exact: false,
    });
    const bankButton = screen.getByLabelText('Swedbank');
    const paymentButton = screen.getByRole('button', { name: 'Make payment' });

    userEvent.type(amountInput, '23');
    userEvent.click(bankButton);
    userEvent.click(paymentButton);

    await waitFor(() =>
      expect(windowLocation).toHaveBeenCalledWith(
        'https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with.23.EUR.SWEDBANK',
      ),
    );
    await waitFor(() => expect(windowLocation).toHaveBeenCalledTimes(1));
  });
});
