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

    history.push('/3rd-pillar-gift');
  });

  test('gift page is being shown', async () => {
    expect(
      await screen.findByText(
        '🎁 A gift to a loved one - a contribution to their Tuleva III Pillar Pension Fund',
      ),
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
    const personalCode = await personalCodeInput();
    const amount = await amountInput();
    const lhvBank = await lhvButton();
    const makePayment = await makePaymentButton();
    userEvent.type(personalCode, '49001011238');
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

  test('can see Other bank payment details', async () => {
    const personalCode = await personalCodeInput();
    const amount = await amountInput();
    const otherBank = await otherBankButton();
    userEvent.type(personalCode, '49001011238');
    userEvent.type(amount, '23');
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
    ).toHaveTextContent('30101119828, IK:49001011238, EE3600001707');
    expect(screen.queryByText('Payment reference:')).not.toBeInTheDocument();
    expect(screen.queryByText('9876543210')).not.toBeInTheDocument();
  });

  test('can go back to account page after seeing the other bank payment details', async () => {
    const personalCode = await personalCodeInput();
    userEvent.type(personalCode, '49001011238');
    const amount = await amountInput();
    userEvent.type(amount, '34');
    const otherBank = await otherBankButton();
    userEvent.click(otherBank);
    const backToAccountPage = await backToAccountPageButton();
    userEvent.click(backToAccountPage);

    expect(await screen.findByText('Hi, John Doe!')).toBeInTheDocument();
  });

  const personalCodeInput: () => Promise<HTMLInputElement> = async () =>
    screen.findByLabelText('Who should receive the gift?', {
      exact: false,
    });
  const amountInput: () => Promise<HTMLInputElement> = async () =>
    screen.findByLabelText('What is the gift payment amount?', {
      exact: false,
    });
  const lhvButton: () => Promise<HTMLInputElement> = async () => screen.findByLabelText('LHV');

  const otherBankButton = async () => screen.findByLabelText('Other bank');

  const makePaymentButton = async () => screen.findByRole('button', { name: 'Make payment' });
  const queryMakePaymentButton = () => screen.queryByRole('button', { name: 'Make payment' });

  const logIntoInternetBankButton = async () =>
    screen.findByRole('button', { name: 'Log into internet bank' });
  const queryLogIntoInternetBankButton = () =>
    screen.queryByRole('button', { name: 'Log into internet bank' });

  const backToAccountPageButton = async () => screen.findByText('Back to account page');
});
