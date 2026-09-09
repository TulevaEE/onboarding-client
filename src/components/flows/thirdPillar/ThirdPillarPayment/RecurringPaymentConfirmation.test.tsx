import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { nudgeBackend, useTestBackendsExcept } from '../../../../test/backend';
import LoggedInApp from '../../../LoggedInApp';

describe('Third pillar payment confirmation', () => {
  const server = setupServer();
  let history: History;
  let trackedEvents: unknown[];

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
    useTestBackendsExcept(server, ['trackedEvents', 'nudge']);
    server.use(
      rest.post('http://localhost/v1/t', (req, res, ctx) => {
        trackedEvents.push(req.body);
        return res(ctx.json({}));
      }),
      rest.post('http://localhost/v1/third-pillar-payment-reminders/cancellations', (_req, res) =>
        res(),
      ),
    );
  });

  const main = () => within(screen.getByRole('main'));

  test('asks for confirmation before showing any nudge', async () => {
    nudgeBackend(server, { key: 'THIRD_PILLAR_RAISE', tag: 'nudge_third_pillar_raise' });
    initializeComponent();
    history.push('/3rd-pillar-payment/recurring-confirmation?type=RECURRING');

    expect(
      await screen.findByRole('heading', { name: 'Did you set up the recurring payment?' }),
    ).toBeInTheDocument();
    expect(main().queryByRole('link', { name: 'Calculate your gain' })).not.toBeInTheDocument();
  });

  test('shows the recurring confirmation nudge the server decided on', async () => {
    nudgeBackend(server, { key: 'THIRD_PILLAR_RAISE', tag: 'nudge_third_pillar_raise' });
    initializeComponent();
    history.push('/3rd-pillar-payment/recurring-confirmation?type=RECURRING&confirmed=true');

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
          path: '/3rd-pillar-payment/recurring-confirmation',
          channel: 'SCREEN',
        },
      }),
    );
  });

  test('asks for the single payment nudge in the payment context', async () => {
    nudgeBackend(server, { key: 'MEMBERSHIP', tag: 'nudge_membership' });
    initializeComponent();
    history.push('/3rd-pillar-payment/recurring-confirmation?type=SINGLE&confirmed=true');

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'Become a member' })).toHaveAttribute(
      'href',
      '/join',
    );
    await waitFor(() =>
      expect(trackedEvents).toContainEqual({
        type: 'NUDGE_VIEW',
        data: {
          context: 'THIRD_PILLAR_PAYMENT',
          key: 'MEMBERSHIP',
          tag: 'nudge_membership',
          path: '/3rd-pillar-payment/recurring-confirmation',
          channel: 'SCREEN',
        },
      }),
    );
  });
});
