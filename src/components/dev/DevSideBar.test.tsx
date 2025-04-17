import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { initializeConfiguration } from '../config/config';
import { useTestBackends } from '../../test/backend';
import LoggedInApp from '../LoggedInApp';
import { writeMockModeConfiguration } from '../common/requestMocker';

describe('dev sidebar', () => {
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

    useTestBackends(server);

    initializeComponent();
  });

  test('dev sidebar is shown with query param', async () => {
    history.push({
      pathname: '/account',
      search: '?dev',
    });
    expect(await screen.findByText('Mock mode')).toBeInTheDocument();
  });

  test('dev sidebar is shown with written mock mode configuration', async () => {
    writeMockModeConfiguration({ user: 'NO_SECOND_NO_THIRD_PILLAR' });
    history.push({
      pathname: '/account',
    });
    expect(await screen.findByText('Mock mode')).toBeInTheDocument();
  });
});
