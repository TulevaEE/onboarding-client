import React from 'react';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import { nudgeBackend, useTestBackendsExcept } from '../../../test/backend';
import LoggedInApp from '../../LoggedInApp';

describe('Second pillar payment rate success screen', () => {
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

  test('keeps a single primary button when a nudge is shown', async () => {
    nudgeBackend(server, { key: 'THIRD_PILLAR_START', tag: 'nudge_third_pillar' });
    initializeComponent();
    history.push('/2nd-pillar-payment-rate-success');

    expect(await main().findByRole('link', { name: 'Calculate your tax benefit' })).toHaveClass(
      'btn-primary',
    );
    expect(main().getByRole('link', { name: 'My Account' })).toHaveClass('btn-outline-primary');
    expect(main().getByRole('link', { name: 'My Account' })).not.toHaveClass('btn-primary');
  });
});
