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

    history.push('/partner/3rd-pillar-flow/success');
  });

  test('recurring payment button is shown', async () => {
    expect(await screen.findByText('Make contributions to it automatic')).toBeInTheDocument();
    const button = await recurringPaymentButton();
    expect(button).toBeEnabled();
  });

  const recurringPaymentButton = async () =>
    screen.findByRole('button', { name: 'Set up recurring payment' });
});
