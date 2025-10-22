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

describe('When is at the partner 2nd pillar flow success screen', () => {
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
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(async () => {
    initializeConfiguration();

    userConversionBackend(server);
    userBackend(server);
    amlChecksBackend(server);
    pensionAccountStatementBackend(server);
    fundsBackend(server);
    paymentLinkBackend(server);
    applicationsBackend(server);
    returnsBackend(server);

    initializeComponent();

    history.push('/partner/2nd-pillar-flow-success');
  });

  test('success title is shown', async () => {
    expect(await screen.findByText('Application finished')).toBeInTheDocument();
  });

  describe('payment rate increase upsell', () => {
    test('shows upsell when user has 2% contribution rate', async () => {
      expect(await screen.findByText(/Increase your II pillar contribution/i)).toBeInTheDocument();
    });

    test('upsell has link to payment rate change page', async () => {
      const increaseLink = await screen.findByRole('link', {
        name: /Increase contribution/i,
      });
      expect(increaseLink).toBeInTheDocument();
      expect(increaseLink).toHaveAttribute('href', '/2nd-pillar-payment-rate');
    });
  });
});
