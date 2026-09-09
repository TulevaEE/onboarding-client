import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient } from '@tanstack/react-query';
import { screen, waitFor, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import {
  applicationsBackend,
  nudgeBackend,
  useTestBackends,
  useTestBackendsExcept,
} from '../../../../test/backend';
import { mockFunds } from '../../../../test/backend-responses';
import { Application } from '../../../common/apiModels';
import LoggedInApp from '../../../LoggedInApp';

describe('Third pillar success screen', () => {
  const server = setupServer();
  let history: History;

  function initializeComponent(queryClient?: QueryClient) {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    login(store);
    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store, queryClient);
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    initializeConfiguration();
  });

  const main = () => within(screen.getByRole('main'));

  test('confirms the payment and shows the nudge the server decided on', async () => {
    const trackedEvents: unknown[] = [];
    useTestBackendsExcept(server, ['trackedEvents', 'nudge']);
    nudgeBackend(server, { key: 'SECOND_PILLAR_PAYMENT_RATE', tag: 'nudge_payment_rate' });
    server.use(
      rest.post('http://localhost/v1/t', (req, res, ctx) => {
        trackedEvents.push(req.body);
        return res(ctx.json({}));
      }),
    );
    initializeComponent();
    history.push('/3rd-pillar-success');

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'That puts you among the top 30% of people in Estonia who save in the third pillar.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('New fund units will reach your account within 2 working days.'),
    ).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'Increase your contribution' })).toHaveAttribute(
      'href',
      '/2nd-pillar-payment-rate',
    );
    await waitFor(() =>
      expect(trackedEvents).toContainEqual({
        type: 'NUDGE_VIEW',
        data: {
          context: 'THIRD_PILLAR_PAYMENT',
          key: 'SECOND_PILLAR_PAYMENT_RATE',
          tag: 'nudge_payment_rate',
          path: '/3rd-pillar-success',
          channel: 'SCREEN',
        },
      }),
    );
  });

  test('shows the fee comparison the server sent with the transfer nudge', async () => {
    useTestBackendsExcept(server, ['nudge']);
    nudgeBackend(server, {
      key: 'SECOND_PILLAR_TRANSFER',
      tag: 'nudge_second_pillar',
      feeComparison: {
        currentFeePercent: 0.65,
        currentFeeAmount: 650,
        tulevaFeeAmount: 390,
        savingsAmount: 260,
      },
    });
    initializeComponent();
    history.push('/3rd-pillar-success');

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      '/2nd-pillar-flow',
    );
    expect(main().getAllByText(/650/).length).toBeGreaterThan(0);
    expect(main().getAllByText(/390/).length).toBeGreaterThan(0);
  });

  test('still confirms the payment when the nudge fails to load', async () => {
    useTestBackendsExcept(server, ['nudge']);
    server.use(rest.get('http://localhost/v1/me/nudge', (req, res, ctx) => res(ctx.status(500))));
    initializeComponent(new QueryClient({ defaultOptions: { queries: { retry: false } } }));
    history.push('/3rd-pillar-success');

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'My account' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(main().queryByRole('link', { name: 'Learn more' })).not.toBeInTheDocument();
  });

  test('nudges the saver with the ownership argument when no fee comparison is sent', async () => {
    useTestBackendsExcept(server, ['nudge']);
    nudgeBackend(server, { key: 'SECOND_PILLAR_TRANSFER', tag: 'nudge_second_pillar' });
    initializeComponent();
    history.push('/3rd-pillar-success');

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
    expect(
      await main().findByRole('link', { name: /Bring your II\spillar to Tuleva/ }),
    ).toHaveAttribute('href', '/2nd-pillar-flow');
    expect(main().queryByText(/high fee II\spillar funds/)).not.toBeInTheDocument();
  });

  test('shows only the plain success message when the server decides on no nudge', async () => {
    useTestBackends(server);
    initializeComponent();
    history.push('/3rd-pillar-success');

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'My account' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(main().queryByRole('link', { name: 'Learn more' })).not.toBeInTheDocument();
    expect(
      main().queryByRole('link', { name: 'Increase your contribution' }),
    ).not.toBeInTheDocument();
  });

  test('confirms the submitted application instead of a payment for a transfer-in saver', async () => {
    useTestBackendsExcept(server, ['applications', 'nudge']);
    applicationsBackend(server, [pendingThirdPillarTransfer]);
    nudgeBackend(server, { key: 'SECOND_PILLAR_TRANSFER', tag: 'nudge_second_pillar' });
    initializeComponent();
    history.push('/3rd-pillar-success');

    expect(
      await screen.findByRole('heading', { name: 'Application submitted' }),
    ).toBeInTheDocument();
    expect(
      await main().findByRole('link', { name: /Bring your II\spillar to Tuleva/ }),
    ).toHaveAttribute('href', '/2nd-pillar-flow');
  });

  const thirdPillarFund = mockFunds.find(({ isin }) => isin === 'EE3600001707');
  if (!thirdPillarFund) {
    throw new Error('Tuleva third pillar fund missing from mock funds');
  }

  const pendingThirdPillarTransfer: Application = {
    id: 1,
    status: 'PENDING',
    creationTime: '2026-08-17T10:00:00Z',
    type: 'TRANSFER',
    details: {
      sourceFund: thirdPillarFund,
      exchanges: [],
      cancellationDeadline: '2026-08-31T00:00:00Z',
    },
  };
});
