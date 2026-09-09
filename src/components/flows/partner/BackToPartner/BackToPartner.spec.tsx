import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { nudgeBackend, useTestBackendsExcept } from '../../../../test/backend';
import LoggedInApp from '../../../LoggedInApp';
import { EXTERNAL_AUTHENTICATOR_PROVIDER } from '../../../TriggerProcedure/utils';

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
    sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_PROVIDER, 'COOP_PANK');
    useTestBackendsExcept(server, ['nudge']);
  });

  const main = () => within(screen.getByRole('main'));

  const openSuccessScreen = () => {
    initializeComponent();
    history.push('/partner/3rd-pillar-flow/success');
  };

  test('third pillar opened message is shown', async () => {
    nudgeBackend(server);
    openSuccessScreen();

    expect(
      await screen.findByRole('heading', { name: /Your III\spillar is opened/ }),
    ).toBeInTheDocument();
  });

  test('account button is shown', async () => {
    nudgeBackend(server);
    openSuccessScreen();

    expect(await main().findByRole('link', { name: 'View your account balance' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  test('single payment button is shown', async () => {
    nudgeBackend(server);
    openSuccessScreen();

    const button = await singlePaymentButton();
    await waitFor(() => expect(button).toBeEnabled());
  });

  test('single payment button posts the payment link to the partner app', async () => {
    nudgeBackend(server);
    const postMessage = jest.fn();
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = { postMessage };
    server.use(
      rest.get('http://localhost/v1/payments/link', (req, res, ctx) => {
        if (
          req.url.searchParams.get('paymentChannel') !== 'PARTNER' ||
          req.url.searchParams.get('type') !== 'SINGLE'
        ) {
          return res(ctx.status(400), ctx.json({ errors: [{ code: 'payment.amount.required' }] }));
        }
        return res(
          ctx.json({
            type: 'PREFILLED',
            url: JSON.stringify({ accountNumber: 'EE362200221067235244' }),
          }),
        );
      }),
    );
    openSuccessScreen();

    const button = await singlePaymentButton();
    await waitFor(() => expect(button).toBeEnabled());
    userEvent.click(button);

    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      type: 'newPayment',
      version: '1',
      data: { accountNumber: 'EE362200221067235244' },
      time: expect.any(String),
    });
  });

  test('shows an error when the payment link cannot be fetched', async () => {
    nudgeBackend(server);
    server.use(
      rest.get('http://localhost/v1/payments/link', (req, res, ctx) =>
        res(ctx.status(400), ctx.json({ errors: [{ code: 'payment.amount.required' }] })),
      ),
    );
    openSuccessScreen();

    const button = await singlePaymentButton();
    await waitFor(() => expect(button).toBeEnabled());
    userEvent.click(button);

    expect(
      await screen.findByText('An unexpected error occurred while initiating process'),
    ).toBeInTheDocument();
    await waitFor(() => expect(button).toBeEnabled());
  });

  test('shows the nudge the server decided on', async () => {
    nudgeBackend(server, {
      key: 'THIRD_PILLAR_RECURRING',
      tag: 'nudge_third_pillar_recurring',
    });
    openSuccessScreen();

    expect(
      await main().findByRole('heading', { name: 'Make saving automatic' }),
    ).toBeInTheDocument();
    expect(await recurringPaymentButton()).toBeInTheDocument();
    expect(
      main().queryByRole('link', { name: 'Set up a recurring payment' }),
    ).not.toBeInTheDocument();
  });

  test('recurring payment nudge posts the payment link back to the partner app', async () => {
    nudgeBackend(server, {
      key: 'THIRD_PILLAR_RECURRING',
      tag: 'nudge_third_pillar_recurring',
    });
    const trackedEvents: unknown[] = [];
    const postMessage = jest.fn();
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = { postMessage };
    server.use(
      rest.post('http://localhost/v1/t', (req, res, ctx) => {
        trackedEvents.push(req.body);
        return res(ctx.json({}));
      }),
      rest.get('http://localhost/v1/payments/link', (req, res, ctx) => {
        if (
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
    openSuccessScreen();

    await waitFor(async () => expect(await singlePaymentButton()).toBeEnabled());
    userEvent.click(await recurringPaymentButton());

    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      type: 'newRecurringPayment',
      version: '1',
      data: { accountNumber: 'EE362200221067235244', interval: 'MONTHLY' },
      time: expect.any(String),
    });
    await waitFor(() =>
      expect(trackedEvents).toContainEqual({
        type: 'NUDGE_CLICK',
        data: {
          context: 'THIRD_PILLAR_MANDATE',
          key: 'THIRD_PILLAR_RECURRING',
          tag: 'nudge_third_pillar_recurring',
          path: '/partner/3rd-pillar-flow/success',
          channel: 'SCREEN',
        },
      }),
    );
  });

  test('shows no nudge when the server decides on none', async () => {
    nudgeBackend(server);
    openSuccessScreen();

    expect(
      await screen.findByRole('heading', { name: /Your III\spillar is opened/ }),
    ).toBeInTheDocument();
    expect(
      main().queryByRole('heading', { name: 'Make saving automatic' }),
    ).not.toBeInTheDocument();
  });

  const singlePaymentButton = async () => screen.findByRole('button', { name: 'Make a payment' });
  const recurringPaymentButton = async () =>
    main().findByRole('button', { name: 'Set up a recurring payment' });
});
