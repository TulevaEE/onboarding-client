import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { useTestBackends } from '../../../../test/backend';
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

    useTestBackends(server);

    initializeComponent();

    history.push('/3rd-pillar-payment');
  });

  test('payment page is being shown', async () => {
    expect(await screen.findByText(/Contribution to Tuleva.s III.pillar.fund/)).toBeInTheDocument();
    const makePayment = await makePaymentButton();
    expect(makePayment).toBeDisabled();
  });

  test('can fill in amount', async () => {
    const input = await amountInput();
    userEvent.clear(input);
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
    userEvent.clear(amount);
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

  test('prefills the suggested single payment amount', async () => {
    const amount = await amountInput();
    expect(amount.value).toBe('1000');
  });

  test('prefills the suggested recurring amount when switching to recurring', async () => {
    const recurringPayment = await recurringPaymentOption();
    userEvent.click(recurringPayment);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('200'));
  });

  test('can start a one time payment without changing the prefilled amount', async () => {
    const lhvBank = await lhvButton();
    const makePayment = await makePaymentButton();
    userEvent.click(lhvBank);
    userEvent.click(makePayment);

    await waitFor(() =>
      expect(windowLocation).toHaveBeenCalledWith(
        'https://sandbox-payments.montonio.com?payment_token=example.jwt.token.with.1000.EUR.LHV',
      ),
    );
    expect(windowLocation).toHaveBeenCalledTimes(1);
  });

  test('can start a recurring payment', async () => {
    const recurringPayment = await recurringPaymentOption();
    const amount = await amountInput();
    const lhvBank = await lhvButton();
    userEvent.click(recurringPayment);
    userEvent.clear(amount);
    userEvent.type(amount, '34');
    userEvent.click(lhvBank);

    const logIntoInternetBank = await logIntoInternetBankButton();
    userEvent.click(logIntoInternetBank);

    await waitFor(() =>
      expect(windowLocation).toHaveBeenCalledWith('https://LHV.EE/RECURRING.34.EUR'),
    );
    expect(windowLocation).toHaveBeenCalledTimes(1);
  });

  test('shows a confirmation screen after the bank opens in a new tab for a recurring payment', async () => {
    const fakeWindow = { location: { replace: jest.fn() }, document: { write: jest.fn() } };
    const windowOpen = jest.spyOn(window, 'open').mockReturnValue(fakeWindow as unknown as Window);

    const recurringPayment = await recurringPaymentOption();
    const amount = await amountInput();
    const lhvBank = await lhvButton();
    userEvent.click(recurringPayment);
    userEvent.clear(amount);
    userEvent.type(amount, '34');
    userEvent.click(lhvBank);
    userEvent.click(await logIntoInternetBankButton());

    await waitFor(() =>
      expect(fakeWindow.location.replace).toHaveBeenCalledWith('https://LHV.EE/RECURRING.34.EUR'),
    );
    expect(
      await screen.findByRole('heading', { name: 'Did you set up the recurring payment?' }),
    ).toBeInTheDocument();
    windowOpen.mockRestore();
  });

  test('confirming the recurring payment shows support with a second pillar nudge and cancels the payment reminder', async () => {
    const reminderCancellation = jest.fn();
    server.use(
      rest.post(
        'http://localhost/v1/third-pillar-payment-reminders/cancellations',
        (req, res, ctx) => {
          reminderCancellation();
          return res(ctx.status(200), ctx.json({}));
        },
      ),
    );
    const fakeWindow = { location: { replace: jest.fn() }, document: { write: jest.fn() } };
    const windowOpen = jest.spyOn(window, 'open').mockReturnValue(fakeWindow as unknown as Window);

    const recurringPayment = await recurringPaymentOption();
    const lhvBank = await lhvButton();
    userEvent.click(recurringPayment);
    userEvent.click(lhvBank);
    userEvent.click(await logIntoInternetBankButton());
    userEvent.click(await screen.findByRole('button', { name: 'Yes, done' }));

    expect(
      await screen.findByRole('heading', { name: 'Recurring payment set up' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Increase your contribution' })).toHaveAttribute(
      'href',
      '/2nd-pillar-payment-rate',
    );
    await waitFor(() => expect(reminderCancellation).toHaveBeenCalled());
    windowOpen.mockRestore();
  });

  test('can see recurring payment details', async () => {
    const recurringPayment = await recurringPaymentOption();
    const lhvBank = await paymentInfoButton();
    userEvent.click(recurringPayment);
    userEvent.click(lhvBank);

    expect(await screen.findByText('Pay to:')).toBeInTheDocument();
    expect(screen.getByText('AS Pensionikeskus')).toBeInTheDocument();
    expect(screen.getByText('Account number:')).toBeInTheDocument();
    expect(screen.getByText('EE362200221067235244')).toBeInTheDocument();
    expect(screen.getByText('Payment description:')).toBeInTheDocument();
    expect(screen.getByText('30101119828, IK:39001011234, EE3600001707')).toBeInTheDocument();
  });

  test('can confirm the recurring payment after seeing other banks recurring payment details', async () => {
    const recurringPayment = await recurringPaymentOption();
    const amount = await amountInput();
    const paymentInfo = await paymentInfoButton();

    userEvent.click(recurringPayment);
    userEvent.type(amount, '34');
    userEvent.click(paymentInfo);
    userEvent.click(await confirmDoneLink());

    expect(
      await screen.findByRole('heading', { name: 'Recurring payment set up' }),
    ).toBeInTheDocument();
  });

  test('can see Other bank payment details', async () => {
    const paymentInfo = await paymentInfoButton();
    userEvent.click(paymentInfo);

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
    ).toHaveTextContent('30101119828, IK:39001011234, EE3600001707');
    expect(screen.queryByText('Payment reference:')).not.toBeInTheDocument();
    expect(screen.queryByText('9876543210')).not.toBeInTheDocument();
  });

  test('can confirm the payment after seeing the other bank payment details', async () => {
    const amount = await amountInput();
    userEvent.type(amount, '34');
    const paymentInfo = await paymentInfoButton();
    userEvent.click(paymentInfo);
    userEvent.click(await confirmDoneLink());

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
  });

  test('can switch between Single and Recurring payment', async () => {
    const recurringPayment = await recurringPaymentOption();
    const amount = await amountInput();
    const lhvBank = await lhvButton();
    userEvent.click(recurringPayment);
    userEvent.type(amount, '34');
    userEvent.click(lhvBank);
    expect(queryMakePaymentButton()).not.toBeInTheDocument();
    expect(await logIntoInternetBankButton()).toBeInTheDocument();
    expect(await confirmDoneLink()).toBeInTheDocument();

    const singlePayment = await singlePaymentOption();
    userEvent.click(singlePayment);
    expect(queryLogIntoInternetBankButton()).not.toBeInTheDocument();
    expect(await makePaymentButton()).toBeInTheDocument();
  });

  const singlePaymentOption = async () => screen.findByLabelText('Single payment');
  const recurringPaymentOption = async () => screen.findByLabelText('Recurring payment');
  const amountInput: () => Promise<HTMLInputElement> = async () =>
    screen.findByLabelText('What is the payment amount?', {
      exact: false,
    });
  const lhvButton: () => Promise<HTMLInputElement> = async () => screen.findByLabelText('LHV');

  const paymentInfoButton = async () => screen.findByLabelText('Payment info');

  const makePaymentButton = async () => screen.findByRole('button', { name: 'Start payment' });
  const queryMakePaymentButton = () => screen.queryByRole('button', { name: 'Start payment' });

  const logIntoInternetBankButton = async () =>
    screen.findByRole('button', { name: 'Log into internet bank' });
  const queryLogIntoInternetBankButton = () =>
    screen.queryByRole('button', { name: 'Log into internet bank' });

  const confirmDoneLink = async () => screen.findByRole('link', { name: 'Yes, done' });
});
