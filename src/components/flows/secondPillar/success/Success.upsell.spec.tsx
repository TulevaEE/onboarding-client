import React from 'react';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
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

describe('2nd Pillar Success - Payment Rate Increase Upsell', () => {
  const server = setupServer();
  let history: History;

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

    userConversionBackend(server);
    amlChecksBackend(server);
    pensionAccountStatementBackend(server);
    fundsBackend(server);
    paymentLinkBackend(server);
    applicationsBackend(server);
    returnsBackend(server);
  });

  describe('shows upsell when user can still increase (not at max)', () => {
    test('shows upsell when current rate is 2% with no pending', async () => {
      userBackend(server, {
        secondPillarPaymentRates: { current: 2, pending: null },
      });

      initializeComponent();
      history.push('/partner/2nd-pillar-flow-success');

      expect(await screen.findByText(/Increase your II pillar contribution/i)).toBeInTheDocument();
    });

    test('shows upsell when current is 2% with pending 4% (can still increase to 6%)', async () => {
      userBackend(server, {
        secondPillarPaymentRates: { current: 2, pending: 4 },
      });

      initializeComponent();
      history.push('/partner/2nd-pillar-flow-success');

      expect(await screen.findByText(/Increase your II pillar contribution/i)).toBeInTheDocument();
    });

    test('shows upsell when current rate is 4% with no pending', async () => {
      userBackend(server, {
        secondPillarPaymentRates: { current: 4, pending: null },
      });

      initializeComponent();
      history.push('/partner/2nd-pillar-flow-success');

      expect(await screen.findByText(/Increase your II pillar contribution/i)).toBeInTheDocument();
    });

    test('shows upsell when decreasing from 6% to 4%', async () => {
      userBackend(server, {
        secondPillarPaymentRates: { current: 6, pending: 4 },
      });

      initializeComponent();
      history.push('/partner/2nd-pillar-flow-success');

      expect(await screen.findByText(/Increase your II pillar contribution/i)).toBeInTheDocument();
    });

    test('shows upsell when decreasing from 6% to 2%', async () => {
      userBackend(server, {
        secondPillarPaymentRates: { current: 6, pending: 2 },
      });

      initializeComponent();
      history.push('/partner/2nd-pillar-flow-success');

      expect(await screen.findByText(/Increase your II pillar contribution/i)).toBeInTheDocument();
    });

    test('shows upsell when decreasing from 4% to 2%', async () => {
      userBackend(server, {
        secondPillarPaymentRates: { current: 4, pending: 2 },
      });

      initializeComponent();
      history.push('/partner/2nd-pillar-flow-success');

      expect(await screen.findByText(/Increase your II pillar contribution/i)).toBeInTheDocument();
    });
  });

  describe('does not show upsell when already at max (6%)', () => {
    test('does not show upsell when current rate is 6% with no pending', async () => {
      userBackend(server, {
        secondPillarPaymentRates: { current: 6, pending: null },
      });

      initializeComponent();
      history.push('/partner/2nd-pillar-flow-success');

      expect(await screen.findByText('Application finished')).toBeInTheDocument();

      expect(screen.queryByText(/Increase your II pillar contribution/i)).not.toBeInTheDocument();
    });

    test('does not show upsell when pending rate is 6% (2% -> 6%)', async () => {
      userBackend(server, {
        secondPillarPaymentRates: { current: 2, pending: 6 },
      });

      initializeComponent();
      history.push('/partner/2nd-pillar-flow-success');

      expect(await screen.findByText('Application finished')).toBeInTheDocument();

      expect(screen.queryByText(/Increase your II pillar contribution/i)).not.toBeInTheDocument();
    });

    test('does not show upsell when pending rate is 6% (4% -> 6%)', async () => {
      userBackend(server, {
        secondPillarPaymentRates: { current: 4, pending: 6 },
      });

      initializeComponent();
      history.push('/partner/2nd-pillar-flow-success');

      expect(await screen.findByText('Application finished')).toBeInTheDocument();

      expect(screen.queryByText(/Increase your II pillar contribution/i)).not.toBeInTheDocument();
    });

    test('shows back to account button when at max', async () => {
      userBackend(server, {
        secondPillarPaymentRates: { current: 6, pending: null },
      });

      initializeComponent();
      history.push('/partner/2nd-pillar-flow-success');

      const accountLink = await screen.findByRole('link', { name: /My Account/i });
      expect(accountLink).toBeInTheDocument();
      expect(accountLink).toHaveAttribute(
        'href',
        expect.stringMatching(/^\/account(\?language=en)?$/),
      );
    });
  });
});
