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

    history.push('/3rd-pillar-flow/payment');
  });

  test('payment page is being shown', async () => {
    expect(
      await screen.findByText('Payment instructions for Tuleva III pillar pension fund'),
    ).toBeInTheDocument();
    const makePayment = await makePaymentButton();
    expect(makePayment).toBeDisabled();
  });

  test('can fill in amount', async () => {
    const input = await amountInput();
    userEvent.type(input, '23');
    expect(input.value).toBe('23');
  });

  test('can select bank', async () => {
    const swedButton = await swedbankButton();
    userEvent.click(swedButton);
    expect(swedButton.value).toBe('on');
  });

  test('can start a one time payment', async () => {
    const amount = await amountInput();
    const swedbank = await swedbankButton();
    const makePayment = await makePaymentButton();
    userEvent.type(amount, '23');
    userEvent.click(swedbank);
    userEvent.click(makePayment);

    await waitFor(() =>
      expect(windowLocation).toHaveBeenCalledWith(
        'https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with.23.EUR.SWEDBANK',
      ),
    );
    expect(windowLocation).toHaveBeenCalledTimes(1);
  });

  test('can see recurring payment details', async () => {
    const recurringPayment = await recurringPaymentOption();
    userEvent.click(recurringPayment);

    expect(await screen.findByText('Pay to:')).toBeInTheDocument();
    expect(await screen.findByText('AS Pensionikeskus')).toBeInTheDocument();
    expect(await screen.findByText('Account number:')).toBeInTheDocument();
    expect(await screen.findByText('EE362200221067235244')).toBeInTheDocument();
    expect(await screen.findByText('EE141010220263146225')).toBeInTheDocument();
    expect(await screen.findByText('EE547700771002908125')).toBeInTheDocument();
    expect(await screen.findByText('EE961700017004379157')).toBeInTheDocument();
    expect(await screen.findByText('Payment description:')).toBeInTheDocument();
    expect(await screen.findByText('30101119828')).toBeInTheDocument();
    expect(await screen.findByText('Payment reference:')).toBeInTheDocument();
    expect(await screen.findByText('9876543210')).toBeInTheDocument();
  });

  test('can click Yes after seeing recurring payment details', async () => {
    const recurringPayment = await recurringPaymentOption();
    userEvent.click(recurringPayment);
    const yes = await yesButton();
    userEvent.click(yes);

    expect(await screen.findByText('All done!')).toBeInTheDocument();
  });

  test('can see Other bank payment details', async () => {
    const otherBank = await otherBankButton();
    userEvent.click(otherBank);

    expect(await screen.findByText('Pay to:')).toBeInTheDocument();
    expect(await screen.findByText('AS Pensionikeskus')).toBeInTheDocument();
    expect(await screen.findByText('Account number:')).toBeInTheDocument();
    expect(await screen.findByText('EE362200221067235244')).toBeInTheDocument();
    expect(screen.queryByText('EE141010220263146225')).not.toBeInTheDocument();
    expect(screen.queryByText('EE547700771002908125')).not.toBeInTheDocument();
    expect(screen.queryByText('EE961700017004379157')).not.toBeInTheDocument();
    expect(await screen.findByText('Payment description:')).toBeInTheDocument();
    expect(
      await screen.findByText('30101119828', {
        exact: false,
      }),
    ).toHaveTextContent('30101119828,PK:9876543210');
    expect(screen.queryByText('Payment reference:')).not.toBeInTheDocument();
    expect(screen.queryByText('9876543210')).not.toBeInTheDocument();
  });

  test('can click Yes after seeing Other bank payment details', async () => {
    const otherBank = await otherBankButton();
    userEvent.click(otherBank);
    const yes = await yesButton();
    userEvent.click(yes);

    expect(await screen.findByText('All done!')).toBeInTheDocument();
  });

  test('can switch between Single and Recurring payment', async () => {
    const recurringPayment = await recurringPaymentOption();
    userEvent.click(recurringPayment);
    expect(queryAmountInput()).not.toBeInTheDocument();
    expect(querySwedbankButton()).not.toBeInTheDocument();
    expect(queryOtherBankButton()).not.toBeInTheDocument();

    const singlePayment = await singlePaymentOption();
    userEvent.click(singlePayment);
    expect(await amountInput()).toBeInTheDocument();
    expect(await swedbankButton()).toBeInTheDocument();
    expect(await otherBankButton()).toBeInTheDocument();
  });

  const singlePaymentOption = async () => screen.findByLabelText('Single payment');
  const recurringPaymentOption = async () => screen.findByLabelText('Recurring payment');
  const amountInput: () => Promise<HTMLInputElement> = async () =>
    screen.findByLabelText('What is the payment amount?', {
      exact: false,
    });
  const queryAmountInput = () =>
    screen.queryByLabelText('What is the payment amount?', {
      exact: false,
    });
  const swedbankButton: () => Promise<HTMLInputElement> = async () =>
    screen.findByLabelText('Swedbank');
  const querySwedbankButton = () => screen.queryByLabelText('Swedbank');

  const otherBankButton = async () => screen.findByLabelText('Other bank');
  const queryOtherBankButton = () => screen.queryByLabelText('Other bank');

  const makePaymentButton = async () => screen.findByRole('button', { name: 'Make payment' });
  const yesButton = async () => screen.findByRole('button', { name: 'Yes' });
});
