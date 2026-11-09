import React from 'react';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import {
  createDefaultStore,
  login,
  loginThroughPartner,
  renderWrapped,
} from '../../../../test/utils';
import { initializeConfiguration } from '../../../config/config';
import { nudgeBackend, useTestBackendsExcept } from '../../../../test/backend';
import LoggedInApp from '../../../LoggedInApp';
import { EXTERNAL_AUTHENTICATOR_PROVIDER } from '../../../TriggerProcedure/utils';

describe('When is at the partner 2nd pillar flow success screen', () => {
  const server = setupServer();
  let history: History;

  const windowLocation = jest.fn();
  Object.defineProperty(window, 'location', {
    value: {
      replace: windowLocation,
    },
  });

  function initializeComponent(logIn = login) {
    history = createMemoryHistory();
    const store = createDefaultStore(history as any);
    logIn(store);

    renderWrapped(<Route path="" component={LoggedInApp} />, history as any, store);
  }

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterEach(() => sessionStorage.clear());
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

  test("back to internet bank link leads to Coop's own internet bank", async () => {
    nudgeBackend(server);
    sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_PROVIDER, 'COOP_PANK');
    sessionStorage.setItem('EXTERNAL_AUTHENTICATOR_REDIRECT_URI', 'https://phishing.example/');
    initializeComponent(loginThroughPartner);
    history.push('/partner/2nd-pillar-flow-success');

    expect(await main().findByRole('link', { name: 'Back to internet bank' })).toHaveAttribute(
      'href',
      'https://i.cooppank.ee/i/deposits?lang=en',
    );
  });

  test('shows no back to internet bank link once the person has logged in another way in the same tab', async () => {
    nudgeBackend(server);
    sessionStorage.setItem(EXTERNAL_AUTHENTICATOR_PROVIDER, 'COOP_PANK');
    initializeComponent(login);
    history.push('/partner/2nd-pillar-flow-success');

    expect(await screen.findByText('Application finished')).toBeInTheDocument();
    expect(main().queryByRole('link', { name: 'Back to internet bank' })).not.toBeInTheDocument();
  });

  test('shows no back to internet bank link to someone who did not come from the bank', async () => {
    nudgeBackend(server);
    sessionStorage.setItem('EXTERNAL_AUTHENTICATOR_REDIRECT_URI', 'https://phishing.example/');
    initializeComponent();
    history.push('/partner/2nd-pillar-flow-success');

    expect(await screen.findByText('Application finished')).toBeInTheDocument();
    expect(main().queryByRole('link', { name: 'Back to internet bank' })).not.toBeInTheDocument();
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
