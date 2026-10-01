import React from 'react';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { nudgeBackend, useTestBackendsExcept } from '../../../../test/backend';
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
    useTestBackendsExcept(server, ['nudge']);
  });

  const main = () => within(screen.getByRole('main'));

  test('success title is shown', async () => {
    nudgeBackend(server);
    initializeComponent();
    history.push('/partner/2nd-pillar-flow-success');

    expect(await screen.findByText('Application finished')).toBeInTheDocument();
  });

  test('account button is shown', async () => {
    nudgeBackend(server);
    initializeComponent();
    history.push('/partner/2nd-pillar-flow-success');

    expect(await main().findByRole('link', { name: 'View your account balance' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/account(\?language=en)?$/),
    );
  });

  test('shows the nudge the server decided on', async () => {
    nudgeBackend(server, { key: 'SECOND_PILLAR_PAYMENT_RATE', tag: 'nudge_payment_rate' });
    initializeComponent();
    history.push('/partner/2nd-pillar-flow-success');

    expect(await screen.findByText('Application finished')).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'Increase your contribution' })).toHaveAttribute(
      'href',
      '/2nd-pillar-payment-rate',
    );
  });

  test('shows no nudge when the server decides on none', async () => {
    nudgeBackend(server);
    initializeComponent();
    history.push('/partner/2nd-pillar-flow-success');

    expect(await screen.findByText('Application finished')).toBeInTheDocument();
    expect(
      main().queryByRole('link', { name: 'Increase your contribution' }),
    ).not.toBeInTheDocument();
  });
});
