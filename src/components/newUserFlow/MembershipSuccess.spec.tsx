import React from 'react';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import { nudgeBackend, useTestBackendsExcept } from '../../test/backend';
import LoggedInApp from '../LoggedInApp';

describe('Membership success screen', () => {
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

  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['nudge']);
  });

  const main = () => within(screen.getByRole('main'));

  test('welcomes the new member and links to the account page', async () => {
    nudgeBackend(server);
    initializeComponent();
    history.push('/join/success');

    expect(
      await screen.findByRole('heading', { name: 'Welcome to the cooperative' }),
    ).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'My Account' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  test('shows the nudge the server decided on', async () => {
    nudgeBackend(server, {
      key: 'SAVINGS_FUND',
      tag: 'nudge_savings_fund',
      savingsFundFeePercent: 0.28,
    });
    initializeComponent();
    history.push('/join/success');

    expect(
      await main().findByRole('heading', {
        name: 'Is the Additional Investment Fund your next step?',
      }),
    ).toBeInTheDocument();
    expect(main().getByText(/The fee is 0\.28% per year/)).toBeInTheDocument();
    expect(await main().findByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      '/savings-fund/onboarding',
    );
  });
});
