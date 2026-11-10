import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { captureException } from '@sentry/browser';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import {
  nudgeBackend,
  recurringPaymentConfirmationBackend,
  useTestBackendsExcept,
} from '../../../../test/backend';
import LoggedInApp from '../../../LoggedInApp';

jest.mock('@sentry/browser', () => ({ captureException: jest.fn() }));

describe('Third pillar payment confirmation', () => {
  const server = setupServer();
  let history: History;
  let trackedEvents: unknown[];
  let reminderCancellations: number;

  function initializeComponent() {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
    trackedEvents = [];
    reminderCancellations = 0;
    useTestBackendsExcept(server, ['trackedEvents', 'nudge']);
    server.use(
      rest.post('http://localhost/v1/t', (req, res, ctx) => {
        trackedEvents.push(req.body);
        return res(ctx.json({}));
      }),
      rest.post('http://localhost/v1/third-pillar-payment-reminders/cancellations', (_req, res) => {
        reminderCancellations += 1;
        return res();
      }),
    );
  });

  afterEach(() => jest.clearAllMocks());

  const main = () => within(screen.getByRole('main'));

  test('asks for confirmation before showing any nudge', async () => {
    nudgeBackend(server, { key: 'THIRD_PILLAR_RAISE', tag: 'nudge_third_pillar_raise' });
    initializeComponent();
    history.push('/3rd-pillar-payment/recurring-confirmation');

    expect(
      await screen.findByRole('heading', { name: 'Did you set up the recurring payment?' }),
    ).toBeInTheDocument();
    expect(main().queryByRole('link', { name: 'Calculate your gain' })).not.toBeInTheDocument();
  });

  test('shows the recurring confirmation nudge the server decided on', async () => {
    nudgeBackend(server, { key: 'THIRD_PILLAR_RAISE', tag: 'nudge_third_pillar_raise' });
    initializeComponent();
    history.push('/3rd-pillar-recurring-success');

    expect(
      await screen.findByRole('heading', { name: 'Recurring payment set up' }),
    ).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'My account' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(await main().findByRole('link', { name: 'Calculate your gain' })).toHaveAttribute(
      'href',
      '/3rd-pillar-payment',
    );
    await waitFor(() =>
      expect(trackedEvents).toContainEqual({
        type: 'NUDGE_VIEW',
        data: {
          context: 'THIRD_PILLAR_RECURRING_CONFIRMATION',
          key: 'THIRD_PILLAR_RAISE',
          tag: 'nudge_third_pillar_raise',
          path: '/3rd-pillar-recurring-success',
          channel: 'SCREEN',
        },
      }),
    );
  });

  test('says the tax benefit of a raise is capped at 15% of gross income for the calendar year, not of salary', async () => {
    nudgeBackend(server, { key: 'THIRD_PILLAR_RAISE', tag: 'nudge_third_pillar_raise' });
    initializeComponent();
    history.push('/3rd-pillar-recurring-success');

    expect(
      await main().findByText(
        /The tax benefit covers up to 15% of your gross income for the calendar year,/,
      ),
    ).toBeInTheDocument();
  });

  test('records that the saver set up a recurring payment when they arrive having confirmed it', async () => {
    nudgeBackend(server, { key: 'THIRD_PILLAR_RAISE', tag: 'nudge_third_pillar_raise' });
    const recurringPaymentConfirmations = recurringPaymentConfirmationBackend(server);
    initializeComponent();
    history.push('/3rd-pillar-recurring-success');

    await waitFor(() => expect(recurringPaymentConfirmations()).toBe(1));
    await waitFor(() => expect(reminderCancellations).toBe(1));
    expect(await main().findByRole('link', { name: 'Calculate your gain' })).toBeInTheDocument();
    expect(recurringPaymentConfirmations()).toBe(1);
  });

  test('records that the saver set up a recurring payment only once they say they did', async () => {
    nudgeBackend(server, { key: 'THIRD_PILLAR_RAISE', tag: 'nudge_third_pillar_raise' });
    const recurringPaymentConfirmations = recurringPaymentConfirmationBackend(server);
    initializeComponent();
    history.push('/3rd-pillar-payment/recurring-confirmation');

    const yes = await screen.findByRole('button', { name: 'Yes, done' });
    expect(recurringPaymentConfirmations()).toBe(0);
    userEvent.click(yes);

    await waitFor(() => expect(recurringPaymentConfirmations()).toBe(1));
    expect(history.location.pathname).toBe('/3rd-pillar-recurring-success');
    expect(await main().findByRole('link', { name: 'Calculate your gain' })).toBeInTheDocument();
    expect(recurringPaymentConfirmations()).toBe(1);
  });

  test('still shows the recurring payment as set up and reports the error when recording it fails', async () => {
    nudgeBackend(server, { key: 'THIRD_PILLAR_RAISE', tag: 'nudge_third_pillar_raise' });
    const recurringPaymentConfirmations = recurringPaymentConfirmationBackend(server, 500);
    initializeComponent();
    history.push('/3rd-pillar-recurring-success');

    await waitFor(() => expect(recurringPaymentConfirmations()).toBe(1));
    await waitFor(() => expect(captureException).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByRole('heading', { name: 'Recurring payment set up' }),
    ).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'My account' })).toHaveAttribute(
      'href',
      '/account',
    );
  });
});
