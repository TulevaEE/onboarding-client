import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
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

describe('When is at the partner flow success screen', () => {
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
  afterEach(() => {
    server.resetHandlers();
    sessionStorage.clear();
    delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  });
  afterAll(() => server.close());

  beforeEach(async () => {
    initializeConfiguration();
    sessionStorage.setItem('EXTERNAL_AUTHENTICATOR_PROVIDER', 'COOP_PANK');

    userConversionBackend(server);
    userBackend(server);
    amlChecksBackend(server);
    pensionAccountStatementBackend(server);
    fundsBackend(server);
    paymentLinkBackend(server);
    applicationsBackend(server);
    returnsBackend(server);

    initializeComponent();

    history.push('/partner/3rd-pillar-flow/success');
  });

  test('payment card is shown', async () => {
    expect(await screen.findByText('Make contributions automatic')).toBeInTheDocument();
  });

  test('recurring payment button is shown', async () => {
    const button = await recurringPaymentButton();
    await waitFor(() => expect(button).toBeEnabled());
  });

  test('single payment button is shown', async () => {
    const button = await singlePaymentButton();
    await waitFor(() => expect(button).toBeEnabled());
  });

  test('recurring payment button posts the payment link to the partner app without an amount', async () => {
    const postMessage = jest.fn();
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = { postMessage };
    server.use(
      rest.get('http://localhost/v1/payments/link', (req, res, ctx) => {
        if (
          req.url.searchParams.get('amount') !== null ||
          req.url.searchParams.get('paymentChannel') !== 'PARTNER' ||
          req.url.searchParams.get('type') !== 'RECURRING'
        ) {
          return res(ctx.status(400), ctx.json({ errors: [{ code: 'payment.amount.required' }] }));
        }
        return res(
          ctx.json({
            type: 'PREFILLED',
            url: JSON.stringify({ accountNumber: 'EE362200221067235244', interval: 'MONTHLY' }),
          }),
        );
      }),
    );

    const button = await recurringPaymentButton();
    await waitFor(() => expect(button).toBeEnabled());
    userEvent.click(button);

    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      type: 'newRecurringPayment',
      version: '1',
      data: { accountNumber: 'EE362200221067235244', interval: 'MONTHLY' },
      time: expect.any(String),
    });
  });

  test('shows an error when the payment link cannot be fetched', async () => {
    server.use(
      rest.get('http://localhost/v1/payments/link', (req, res, ctx) =>
        res(ctx.status(400), ctx.json({ errors: [{ code: 'payment.amount.required' }] })),
      ),
    );

    const button = await recurringPaymentButton();
    await waitFor(() => expect(button).toBeEnabled());
    userEvent.click(button);

    expect(
      await screen.findByText('An unexpected error occurred while initiating process'),
    ).toBeInTheDocument();
    await waitFor(() => expect(button).toBeEnabled());
  });

  const recurringPaymentButton = async () =>
    screen.findByRole('button', { name: 'Set up a recurring payment' });

  const singlePaymentButton = async () => screen.findByRole('button', { name: 'Make a payment' });
});
