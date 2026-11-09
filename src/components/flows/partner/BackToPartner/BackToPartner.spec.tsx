import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, loginThroughPartner, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { useTestBackendsExcept } from '../../../../test/backend';
import LoggedInApp from '../../../LoggedInApp';
import { EXTERNAL_AUTHENTICATOR_PROVIDER } from '../../../TriggerProcedure/utils';
import { addDataFromQueryParams } from '../../../thirdPillar/actions';

describe('When is at the partner flow success screen', () => {
  const server = setupServer();
  let history: History;

  const windowLocation = jest.fn();
  Object.defineProperty(window, 'location', {
    value: {
      replace: windowLocation,
    },
    writable: true,
  });

  function initializeComponent(linkParameters: Record<string, string>) {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    store.dispatch(addDataFromQueryParams(linkParameters));
    loginThroughPartner(store);

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
    window.location.href = '';
  });

  const main = () => within(screen.getByRole('main'));

  const openSuccessScreen = (linkParameters: Record<string, string> = {}) => {
    initializeComponent(linkParameters);
    history.push('/partner/3rd-pillar-flow/success');
  };

  test('third pillar opened message is shown', async () => {
    openSuccessScreen();

    expect(
      await screen.findByRole('heading', { name: /Your III\spillar is opened/ }),
    ).toBeInTheDocument();
  });

  test('account button is shown', async () => {
    openSuccessScreen();

    expect(await main().findByRole('link', { name: 'View your account balance' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  test('single payment button is shown', async () => {
    openSuccessScreen();

    const button = await singlePaymentButton();
    await waitFor(() => expect(button).toBeEnabled());
  });

  test('single payment button posts the payment link to the partner app', async () => {
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

  test('links back to the Coop internet bank by name', async () => {
    openSuccessScreen();

    expect(await main().findByRole('link', { name: /^Back to Coop\sPank$/ })).toHaveAttribute(
      'href',
      'https://i.cooppank.ee/i/deposits?lang=en',
    );
  });

  test('offers a monthly standing order when the partner reports none', async () => {
    openSuccessScreen();

    expect(
      await main().findByRole('heading', { name: 'Make contributions automatic' }),
    ).toBeInTheDocument();
    await waitFor(async () => expect(await recurringPaymentButton()).toBeEnabled());
  });

  test('offers its own standing order without asking the server for a nudge', async () => {
    const nudgeRequests: string[] = [];
    server.use(
      rest.get('http://localhost/v1/me/nudge', (req, res, ctx) => {
        nudgeRequests.push(req.url.searchParams.get('context') ?? '');
        return res(
          ctx.json({ key: 'SAVINGS_FUND_RECURRING', tag: 'nudge_savings_fund_recurring' }),
        );
      }),
    );
    openSuccessScreen();

    await waitFor(async () => expect(await recurringPaymentButton()).toBeEnabled());
    expect(nudgeRequests).toEqual([]);
  });

  test('acknowledges the standing order the partner reports and offers a single payment only', async () => {
    openSuccessScreen({ recurringPaymentCount: '1' });

    expect(
      await main().findByRole('heading', {
        name: 'Good, you have already set up a recurring payment',
      }),
    ).toBeInTheDocument();
    expect(await singlePaymentButton()).toBeInTheDocument();
    expect(
      main().queryByRole('button', { name: 'Set up a recurring payment' }),
    ).not.toBeInTheDocument();
  });

  test('standing order button posts the standing order link to the partner app', async () => {
    const postMessage = jest.fn();
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = { postMessage };
    server.use(
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

  test('standing order button opens the standing order form in the internet bank', async () => {
    server.use(
      rest.get('http://localhost/v1/payments/link', (req, res, ctx) => {
        if (
          req.url.searchParams.get('paymentChannel') !== 'COOP_WEB' ||
          req.url.searchParams.get('type') !== 'RECURRING'
        ) {
          return res(ctx.status(400), ctx.json({ errors: [{ code: 'payment.amount.required' }] }));
        }
        return res(ctx.json({ type: 'PREFILLED', url: 'i/standing-orders/new?lang=en' }));
      }),
    );
    openSuccessScreen();

    const button = await recurringPaymentButton();
    await waitFor(() => expect(button).toBeEnabled());
    userEvent.click(button);

    await waitFor(() =>
      expect(window.location.href).toBe('https://i.cooppank.ee/i/standing-orders/new?lang=en'),
    );
  });

  const singlePaymentButton = async () => screen.findByRole('button', { name: 'Make a payment' });
  const recurringPaymentButton = async () =>
    main().findByRole('button', { name: 'Set up a recurring payment' });
});
