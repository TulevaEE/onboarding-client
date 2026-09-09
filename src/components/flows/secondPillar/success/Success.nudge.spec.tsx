import React from 'react';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { nudgeBackend, userBackend, useTestBackendsExcept } from '../../../../test/backend';
import LoggedInApp from '../../../LoggedInApp';

describe('2nd pillar success screen nudge', () => {
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
    useTestBackendsExcept(server, ['nudge', 'user']);
  });

  const main = () => within(screen.getByRole('main'));

  test('nudges a saver at the maximum payment rate to start a third pillar', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 6, pending: null } });
    nudgeBackend(server, { key: 'THIRD_PILLAR_START', tag: 'nudge_third_pillar' });
    initializeComponent();
    history.push('/partner/2nd-pillar-flow-success');

    expect(await screen.findByText('Application finished')).toBeInTheDocument();
    expect(
      await main().findByRole('heading', {
        name: 'Setting up your third pillar is a smart next step',
      }),
    ).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'Calculate your tax benefit' })).toHaveAttribute(
      'href',
      '/3rd-pillar-flow',
    );
  });

  test('nudges a saver below the maximum payment rate to raise it', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 2, pending: null } });
    nudgeBackend(server, { key: 'SECOND_PILLAR_PAYMENT_RATE', tag: 'nudge_payment_rate' });
    initializeComponent();
    history.push('/partner/2nd-pillar-flow-success');

    expect(await screen.findByText('Application finished')).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'Increase your contribution' })).toHaveAttribute(
      'href',
      '/2nd-pillar-payment-rate',
    );
  });

  test('shows the account button whatever the server decides', async () => {
    userBackend(server, { secondPillarPaymentRates: { current: 2, pending: null } });
    nudgeBackend(server, { key: 'SECOND_PILLAR_PAYMENT_RATE', tag: 'nudge_payment_rate' });
    initializeComponent();
    history.push('/partner/2nd-pillar-flow-success');

    expect(await main().findByRole('link', { name: 'View your account balance' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/account(\?language=en)?$/),
    );
  });
});
