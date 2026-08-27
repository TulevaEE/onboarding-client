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
  pensionAccountStatementBackend,
  userBackend,
  userConversionBackend,
  useTestBackendsExcept,
} from '../../../../test/backend';
import { mockFunds } from '../../../../test/backend-responses';
import { Application, FundBalance } from '../../../common/apiModels';
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

  test('confirms the payment and nudges an at-Tuleva saver with a low payment rate to increase it', async () => {
    const trackedEvents: unknown[] = [];
    useTestBackendsExcept(server, ['trackedEvents']);
    server.use(
      rest.post('http://localhost/v1/t', (req, res, ctx) => {
        trackedEvents.push(req.body);
        return res(ctx.json({}));
      }),
    );
    initializeComponent();
    history.push('/3rd-pillar-success');

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'Increase your contribution' })).toHaveAttribute(
      'href',
      '/2nd-pillar-payment-rate',
    );
    await waitFor(() =>
      expect(trackedEvents).toContainEqual({
        type: 'PAGE_VIEW',
        data: { path: '/3rd-pillar-success', secondPillarNudge: 'INCREASE_PAYMENT_RATE' },
      }),
    );
  });

  test('shows the fee comparison for a high-fee saver whose II pillar is entirely elsewhere', async () => {
    useTestBackendsExcept(server, ['userConversion', 'pensionAccountStatement']);
    userConversionBackend(server, {
      selectionComplete: false,
      transfersComplete: false,
      weightedAverageFee: 0.0065,
    });
    pensionAccountStatementBackend(server, [swedbankSecondPillar, tulevaThirdPillar]);
    initializeComponent();
    history.push('/3rd-pillar-success');

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      '/2nd-pillar-flow',
    );
    expect(screen.getAllByText(/650/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/390/).length).toBeGreaterThan(0);
  });

  test('still confirms the payment when the personalization data fails to load', async () => {
    useTestBackendsExcept(server, ['applications']);
    server.use(
      rest.get('http://localhost/v1/applications', (req, res, ctx) => res(ctx.status(500))),
    );
    initializeComponent(new QueryClient({ defaultOptions: { queries: { retry: false } } }));
    history.push('/3rd-pillar-success');

    // eslint-disable-next-line testing-library/prefer-find-by -- a late re-render replaces the node, so re-query on every retry
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Payment done' })).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(main().getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/account'),
    );
  });

  test('nudges a saver whose II pillar is elsewhere in low-fee funds with the ownership argument', async () => {
    useTestBackendsExcept(server, ['userConversion', 'pensionAccountStatement']);
    userConversionBackend(server, {
      selectionComplete: false,
      transfersComplete: false,
      weightedAverageFee: 0.0029,
    });
    pensionAccountStatementBackend(server, [swedbankSecondPillar, tulevaThirdPillar]);
    initializeComponent();
    history.push('/3rd-pillar-success');

    expect(await screen.findByRole('heading', { name: 'Payment done' })).toBeInTheDocument();
    expect(
      await main().findByRole('link', { name: /Bring your II\spillar to Tuleva/ }),
    ).toHaveAttribute('href', '/2nd-pillar-flow');
    expect(main().queryByText(/high fee II pillar funds/)).not.toBeInTheDocument();
  });

  test('shows only the plain success message when the saver has no second pillar', async () => {
    useTestBackendsExcept(server, ['user']);
    userBackend(server, { secondPillarActive: false });
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
    useTestBackendsExcept(server, ['userConversion', 'applications']);
    userConversionBackend(server, {
      selectionComplete: false,
      transfersComplete: false,
      weightedAverageFee: 0.0065,
    });
    applicationsBackend(server, [pendingThirdPillarTransfer]);
    initializeComponent();
    history.push('/3rd-pillar-success');

    expect(
      await screen.findByRole('heading', { name: 'Application submitted' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      '/2nd-pillar-flow',
    );
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

  const swedbankSecondPillar: FundBalance = {
    fund: {
      fundManager: { name: 'Swedbank' },
      isin: 'EE3600019758',
      name: 'Swedbank Pension Fund K60',
      managementFeeRate: 0.0083,
      pillar: 2,
      ongoingChargesFigure: 0.0065,
      status: 'ACTIVE',
      inceptionDate: '2017-01-01',
      nav: 1.46726,
    },
    value: 100000,
    unavailableValue: 0,
    currency: 'EUR',
    activeContributions: true,
    contributions: 112233.44,
    subtractions: 0,
    profit: -12233.44,
    units: 100000 / 1.46726,
  };

  const tulevaThirdPillar: FundBalance = {
    fund: {
      fundManager: { name: 'Tuleva' },
      isin: 'EE3600001707',
      name: 'Tuleva III Samba Pensionifond',
      managementFeeRate: 0.003,
      pillar: 3,
      ongoingChargesFigure: 0.0043,
      status: 'ACTIVE',
      inceptionDate: '2017-01-01',
      nav: 0.7813,
    },
    value: 1000,
    unavailableValue: 0,
    currency: 'EUR',
    activeContributions: true,
    contributions: 1000,
    subtractions: 0,
    profit: 0,
    units: 1000 / 0.7813,
  };
});
