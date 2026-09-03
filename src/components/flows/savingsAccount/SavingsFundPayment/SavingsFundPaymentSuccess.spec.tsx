import { Route } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMemoryHistory, History } from 'history';
import { screen, waitFor } from '@testing-library/react';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import LoggedInApp from '../../../LoggedInApp';
import { initializeConfiguration } from '../../../config/config';
import { userBackend, useTestBackends } from '../../../../test/backend';

describe('SavingsFundPaymentSuccess', () => {
  const server = setupServer();
  let history: History;

  const initApp = () => {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  };

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(async () => {
    initializeConfiguration();
    useTestBackends(server);
  });

  it('shows the success message with a link to the account page', async () => {
    initApp();
    history.push('/savings-fund/payment/success');

    expect(await screen.findByRole('heading', { name: 'Deposit made' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'The deposit amount will be invested in the fund within two business days. We will notify you of this by email.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute('href', '/account');
  });

  it('nudges to set up a recurring payment', async () => {
    initApp();
    history.push('/savings-fund/payment/success');

    expect(
      await screen.findByRole('heading', { name: 'Make saving automatic' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'With a recurring payment, a deposit reaches your account every month without you having to remember it.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Set up a recurring payment' })).toHaveAttribute(
      'href',
      '/savings-fund/payment?type=RECURRING',
    );
  });

  it('tracks the nudge view', async () => {
    let trackedEvent: unknown;
    server.use(
      rest.post('http://localhost/v1/t', (req, res, ctx) => {
        trackedEvent = req.body;
        return res(ctx.json({}));
      }),
    );
    initApp();
    history.push('/savings-fund/payment/success');

    expect(
      await screen.findByRole('heading', { name: 'Make saving automatic' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(trackedEvent).toEqual({
        type: 'PAGE_VIEW',
        data: {
          path: '/savings-fund/payment/success',
          savingsFundNudge: 'RECURRING_PAYMENT',
        },
      }),
    );
  });

  it('words the nudge for the child when paying under a child role', async () => {
    userBackend(server, {
      // A PERSON role whose code differs from the logged-in user's personal code
      role: { type: 'PERSON', code: '51201011234', name: 'Junior Doe' },
    });
    initApp();
    history.push('/savings-fund/payment/success');

    expect(
      await screen.findByText(
        'With a recurring payment, a deposit reaches your child’s account every month without you having to remember it.',
      ),
    ).toBeInTheDocument();
  });

  it('words the nudge for the company when paying under a company role', async () => {
    userBackend(server, {
      role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'Test Company OÜ' },
    });
    initApp();
    history.push('/savings-fund/payment/success');

    expect(
      await screen.findByText(
        'With a recurring payment, a deposit reaches your company’s account every month without you having to remember it.',
      ),
    ).toBeInTheDocument();
  });
});
