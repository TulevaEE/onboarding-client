import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import config from 'react-global-configuration';
import {
  createDefaultStore,
  login,
  loginThroughPartner,
  renderWrapped,
} from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { useTestBackends } from '../../../../test/backend';
import LoggedInApp from '../../../LoggedInApp';
import {
  EXTERNAL_AUTHENTICATOR_PROVIDER,
  INTERNET_BANK_FROM_LINK,
} from '../../../TriggerProcedure/utils';

describe('When a person who came from Coop Pank makes a III pillar payment', () => {
  const server = setupServer();
  let history: History;
  let paymentLinkRequests: Record<string, string | null>[];

  Object.defineProperty(window, 'location', {
    value: { replace: jest.fn(), href: '' },
    writable: true,
  });

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    sessionStorage.clear();
    delete (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView;
  });
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
    sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_PROVIDER, 'COOP_PANK');
    window.location.href = '';
    paymentLinkRequests = [];
    server.use(
      rest.get('http://localhost/v1/payments/link', (req, res, ctx) => {
        const parameters = Object.fromEntries(
          ['type', 'paymentChannel', 'amount', 'currency'].map((name) => [
            name,
            req.url.searchParams.get(name),
          ]),
        );
        paymentLinkRequests.push(parameters);
        const { type, paymentChannel, amount } = parameters;
        if (paymentChannel === 'PARTNER') {
          return res(
            ctx.json({
              type: 'PREFILLED',
              url: JSON.stringify({
                accountNumber: 'EE362200221067235244',
                amount: Number(amount),
              }),
            }),
          );
        }
        const path = type === 'RECURRING' ? 'i/standing-orders/new' : 'i/payments/new';
        return res(ctx.json({ type: 'PREFILLED', url: `${path}?amt=${amount}&lang=en` }));
      }),
    );
  });

  const openPaymentPage = (logIn: typeof login = loginThroughPartner) => {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    logIn(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
    history.push('/3rd-pillar-payment');
  };

  const enterAmount = async (amount: string) => {
    const input = await screen.findByLabelText(/^What is the (recurring )?payment amount\?/);
    userEvent.clear(input);
    userEvent.type(input, amount);
  };

  test('offers no other banks', async () => {
    openPaymentPage();

    expect(await screen.findByRole('button', { name: 'Start payment' })).toBeInTheDocument();
    expect(screen.queryByLabelText('LHV')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Coop Pank')).not.toBeInTheDocument();
    expect(
      screen.getByText('We will redirect you back to your bank to make the payment.'),
    ).toBeInTheDocument();
  });

  test('opens the payment form in the Coop internet bank with the amount', async () => {
    openPaymentPage();
    await enterAmount('300');

    userEvent.click(await screen.findByRole('button', { name: 'Start payment' }));

    await waitFor(() =>
      expect(window.location.href).toBe('https://i.cooppank.ee/i/payments/new?amt=300&lang=en'),
    );
    expect(paymentLinkRequests).toEqual([
      { type: 'SINGLE', paymentChannel: 'COOP_WEB', amount: '300', currency: 'EUR' },
    ]);
  });

  test('opens the standing order form in the Coop internet bank with the amount', async () => {
    openPaymentPage();
    userEvent.click(await screen.findByRole('radio', { name: /^Recurring\spayment/ }));
    await enterAmount('50');

    userEvent.click(await screen.findByRole('button', { name: 'Set up a recurring payment' }));

    await waitFor(() =>
      expect(window.location.href).toBe(
        'https://i.cooppank.ee/i/standing-orders/new?amt=50&lang=en',
      ),
    );
    expect(paymentLinkRequests).toEqual([
      { type: 'RECURRING', paymentChannel: 'COOP_WEB', amount: '50', currency: 'EUR' },
    ]);
  });

  test('hands the payment over to the Coop app with the amount', async () => {
    const postMessage = jest.fn();
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = { postMessage };
    openPaymentPage();
    await enterAmount('300');

    userEvent.click(await screen.findByRole('button', { name: 'Start payment' }));

    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      type: 'newPayment',
      version: '1',
      data: { accountNumber: 'EE362200221067235244', amount: 300 },
      time: expect.any(String),
    });
    expect(paymentLinkRequests).toEqual([
      { type: 'SINGLE', paymentChannel: 'PARTNER', amount: '300', currency: 'EUR' },
    ]);
    expect(window.location.href).toBe('');
  });

  test('hands the standing order over to the Coop app with the amount', async () => {
    const postMessage = jest.fn();
    (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = { postMessage };
    openPaymentPage();
    userEvent.click(await screen.findByRole('radio', { name: /^Recurring\spayment/ }));
    await enterAmount('50');

    userEvent.click(await screen.findByRole('button', { name: 'Set up a recurring payment' }));

    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      type: 'newRecurringPayment',
      version: '1',
      data: { accountNumber: 'EE362200221067235244', amount: 50 },
      time: expect.any(String),
    });
    expect(paymentLinkRequests).toEqual([
      { type: 'RECURRING', paymentChannel: 'PARTNER', amount: '50', currency: 'EUR' },
    ]);
  });

  describe('where no internet bank address is configured, as on staging', () => {
    beforeEach(() => {
      config.set({ coopInternetBankUrl: undefined }, { freeze: false, assign: true });
    });

    test('opens the payment form at the internet bank address from the link', async () => {
      sessionStorage.setItem(INTERNET_BANK_FROM_LINK, 'https://prelive.example/');
      openPaymentPage();
      await enterAmount('300');

      userEvent.click(await screen.findByRole('button', { name: 'Start payment' }));

      await waitFor(() =>
        expect(window.location.href).toBe('https://prelive.example/i/payments/new?amt=300&lang=en'),
      );
    });

    test('offers the banks in the internet bank when the link had no address', async () => {
      openPaymentPage();

      expect(await screen.findByLabelText('LHV')).toBeInTheDocument();
    });

    test('hands the payment over to the Coop app even without an internet bank address', async () => {
      const postMessage = jest.fn();
      (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = { postMessage };
      openPaymentPage();
      await enterAmount('300');

      userEvent.click(await screen.findByRole('button', { name: 'Start payment' }));

      await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
      expect(screen.queryByLabelText('LHV')).not.toBeInTheDocument();
    });
  });

  test('offers every bank again once the person has logged in another way', async () => {
    openPaymentPage(login);

    expect(await screen.findByLabelText('LHV')).toBeInTheDocument();
    expect(screen.getByLabelText('Coop Pank')).toBeInTheDocument();
  });
});
