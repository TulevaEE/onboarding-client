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

  const windowOpen = jest.spyOn(window, 'open');
  windowOpen.mockImplementation(jest.fn());

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
    const makePayment = await makePaymentButton();
    expect(makePayment).toBeDisabled();
  });

  test('can fill in amount', async () => {
    const input = await amountInput();
    userEvent.type(input, '23');
    expect(input.value).toBe('23');
  });

  test('can select bank', async () => {
    const lhvBank = await lhvButton();
    userEvent.click(lhvBank);
    expect(lhvBank.value).toBe('on');
  });

  test('can start a one time payment', async () => {
    const amount = await amountInput();
    const lhvBank = await lhvButton();
    const makePayment = await makePaymentButton();
    userEvent.type(amount, '23');
    userEvent.click(lhvBank);
    userEvent.click(makePayment);

    await waitFor(() =>
      expect(windowLocation).toHaveBeenCalledWith(
        'https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with.23.EUR.LHV',
      ),
    );
    expect(windowLocation).toHaveBeenCalledTimes(1);
  });

  test('can start a recurring payment', async () => {
    const recurringPayment = await recurringPaymentOption();
    const amount = await amountInput();
    const lhvBank = await lhvButton();
    userEvent.click(recurringPayment);
    userEvent.type(amount, '34');
    userEvent.click(lhvBank);

    const setupStandingOrder = await setupStandingOrderButton();
    userEvent.click(setupStandingOrder);

    await waitFor(() =>
      expect(windowOpen).toHaveBeenCalledWith('https://LHV.EE/RECURRING.34.EUR', '_blank'),
    );
    expect(windowOpen).toHaveBeenCalledTimes(1);
  });

  test('can see recurring payment details', async () => {
    const recurringPayment = await recurringPaymentOption();
    const lhvBank = await lhvButton();
    userEvent.click(recurringPayment);
    userEvent.click(lhvBank);

    // eslint-disable-next-line testing-library/no-debugging-utils
    screen.debug(undefined, Infinity);

    expect(await screen.findByText("Beneficiary's name:")).toBeInTheDocument();
    expect(screen.getByText('AS Pensionikeskus')).toBeInTheDocument();
    expect(screen.getByText("Beneficiary's account no:")).toBeInTheDocument();
    expect(screen.getByText('EE547700771002908125')).toBeInTheDocument();
    expect(screen.getByText('Payment description:')).toBeInTheDocument();
    expect(screen.getByText('30101119828')).toBeInTheDocument();
    expect(screen.getByText('Reference no:')).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();
  });

  test('can click Yes after seeing other banks recurring payment details', async () => {
    const recurringPayment = await recurringPaymentOption();
    const amount = await amountInput();
    const otherBank = await otherBankButton();

    userEvent.click(recurringPayment);
    userEvent.type(amount, '34');
    userEvent.click(otherBank);

    const yes = await yesButton();
    userEvent.click(yes);

    expect(await screen.findByText('All done!')).toBeInTheDocument();
  });

  test('can see Other bank payment details', async () => {
    const otherBank = await otherBankButton();
    userEvent.click(otherBank);

    expect(await screen.findByText('Pay to:')).toBeInTheDocument();
    expect(screen.getByText('AS Pensionikeskus')).toBeInTheDocument();
    expect(screen.getByText('Account number:')).toBeInTheDocument();
    expect(screen.getByText('EE362200221067235244')).toBeInTheDocument();
    expect(screen.queryByText('EE141010220263146225')).not.toBeInTheDocument();
    expect(screen.queryByText('EE547700771002908125')).not.toBeInTheDocument();
    expect(screen.queryByText('EE961700017004379157')).not.toBeInTheDocument();
    expect(screen.getByText('Payment description:')).toBeInTheDocument();
    expect(
      screen.getByText('30101119828', {
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
    const lhvBank = await lhvButton();
    userEvent.click(recurringPayment);
    userEvent.click(lhvBank);
    expect(queryMakePaymentButton()).not.toBeInTheDocument();
    expect(await setupStandingOrderButton()).toBeInTheDocument();

    const singlePayment = await singlePaymentOption();
    userEvent.click(singlePayment);
    expect(querySetupStandingOrderButton()).not.toBeInTheDocument();
    expect(await makePaymentButton()).toBeInTheDocument();
  });

  const singlePaymentOption = async () => screen.findByLabelText('Single payment');
  const recurringPaymentOption = async () => screen.findByLabelText('Recurring payment');
  const amountInput: () => Promise<HTMLInputElement> = async () =>
    screen.findByLabelText('What is the payment amount?', {
      exact: false,
    });
  const lhvButton: () => Promise<HTMLInputElement> = async () => screen.findByLabelText('LHV');

  const otherBankButton = async () => screen.findByLabelText('Other bank');

  const makePaymentButton = async () => screen.findByRole('button', { name: 'Make payment' });
  const queryMakePaymentButton = () => screen.queryByRole('button', { name: 'Make payment' });

  const setupStandingOrderButton = async () =>
    screen.findByRole('button', { name: 'Set up standing order' });
  const querySetupStandingOrderButton = () =>
    screen.queryByRole('button', { name: 'Set up standing order' });

  const yesButton = async () => screen.findByRole('button', { name: 'Yes' });
});
