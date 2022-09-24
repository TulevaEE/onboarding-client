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
  applicationsBackend,
  fundsBackend,
  paymentLinkBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  userBackend,
  userConversionBackend,
} from '../../../../test/backend';
import LoggedInApp from '../../../LoggedInApp';

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

    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
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
    applicationsBackend(server);
    returnsBackend(server);

    initializeComponent();

    history.push('/payment');
  });

  test('payment page is being shown', async () => {
    expect(
      await screen.findByText('Payment instructions for Tuleva III pillar pension fund'),
    ).toBeInTheDocument();

    expect(makePaymentButton()).toBeDisabled();
  });

  test('can fill in amount', async () => {
    userEvent.type(amountInput(), '23');
    expect(amountInput().value).toBe('23');
  });

  test('can select bank', async () => {
    userEvent.click(swedbankButton());
    expect(swedbankButton().value).toBe('on');
  });

  test('can start a one time payment', async () => {
    userEvent.type(amountInput(), '23');
    userEvent.click(swedbankButton());
    userEvent.click(makePaymentButton());

    await waitFor(() =>
      expect(windowLocation).toHaveBeenCalledWith(
        'https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with.23.EUR.SWEDBANK',
      ),
    );
    expect(windowLocation).toHaveBeenCalledTimes(1);
  });

  test('can see recurring payment details', async () => {
    userEvent.click(recurringPaymentOption());

    expect(screen.getByText('Pay to:')).toBeInTheDocument();
    expect(screen.getByText('AS Pensionikeskus')).toBeInTheDocument();
    expect(screen.getByText('Account number:')).toBeInTheDocument();
    expect(screen.getByText('EE362200221067235244')).toBeInTheDocument();
    expect(screen.getByText('EE141010220263146225')).toBeInTheDocument();
    expect(screen.getByText('EE547700771002908125')).toBeInTheDocument();
    expect(screen.getByText('EE961700017004379157')).toBeInTheDocument();
    expect(screen.getByText('Payment description:')).toBeInTheDocument();
    expect(screen.getByText('30101119828')).toBeInTheDocument();
    expect(screen.getByText('Payment reference:')).toBeInTheDocument();
    expect(await screen.findByText('9876543210')).toBeInTheDocument();
  });

  test('can click Yes after seeing recurring payment details', async () => {
    userEvent.click(recurringPaymentOption());
    userEvent.click(yesButton());

    expect(screen.getByText('All done!')).toBeInTheDocument();
  });

  test('can see Other bank payment details', async () => {
    userEvent.click(otherBankButton());

    expect(screen.getByText('Pay to:')).toBeInTheDocument();
    expect(screen.getByText('AS Pensionikeskus')).toBeInTheDocument();
    expect(screen.getByText('Account number:')).toBeInTheDocument();
    expect(screen.getByText('EE362200221067235244')).toBeInTheDocument();
    expect(screen.queryByText('EE141010220263146225')).not.toBeInTheDocument();
    expect(screen.queryByText('EE547700771002908125')).not.toBeInTheDocument();
    expect(screen.queryByText('EE961700017004379157')).not.toBeInTheDocument();
    expect(screen.getByText('Payment description:')).toBeInTheDocument();
    expect(
      await screen.findByText('30101119828', {
        exact: false,
      }),
    ).toHaveTextContent('30101119828,PK:9876543210');
    expect(screen.queryByText('Payment reference:')).not.toBeInTheDocument();
    expect(screen.queryByText('9876543210')).not.toBeInTheDocument();
  });

  test('can click Yes after seeing Other bank payment details', async () => {
    userEvent.click(otherBankButton());
    userEvent.click(yesButton());

    expect(screen.getByText('All done!')).toBeInTheDocument();
  });

  test('can switch between Single and Recurring payment', async () => {
    userEvent.click(recurringPaymentOption());
    expect(queryAmountInput()).not.toBeInTheDocument();
    expect(querySwedbankButton()).not.toBeInTheDocument();
    expect(queryOtherBankButton()).not.toBeInTheDocument();

    userEvent.click(singlePaymentOption());
    expect(amountInput()).toBeInTheDocument();
    expect(swedbankButton()).toBeInTheDocument();
    expect(otherBankButton()).toBeInTheDocument();
  });

  const singlePaymentOption = () => screen.getByLabelText('Single payment');
  const recurringPaymentOption = () => screen.getByLabelText('Recurring payment');
  const amountInput: () => HTMLInputElement = () =>
    screen.getByLabelText('What is the payment amount?', {
      exact: false,
    });
  const queryAmountInput = () =>
    screen.queryByLabelText('What is the payment amount?', {
      exact: false,
    });
  const swedbankButton: () => HTMLInputElement = () => screen.getByLabelText('Swedbank');
  const querySwedbankButton = () => screen.queryByLabelText('Swedbank');

  const otherBankButton = () => screen.getByLabelText('Other bank');
  const queryOtherBankButton = () => screen.queryByLabelText('Other bank');

  const makePaymentButton = () => screen.getByRole('button', { name: 'Make payment' });
  const yesButton = () => screen.getByRole('button', { name: 'Yes' });
});
