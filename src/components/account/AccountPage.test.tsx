import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { useTestBackends, useTestBackendsExcept, userBackend } from '../../test/backend';

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

describe('when user has PERSON role', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackends(server);
    initializeComponent();
    history.push('/account');
  });

  test('renders the person account page', async () => {
    expect(await screen.findByText('Hi, John Doe')).toBeInTheDocument();
  });
});

describe('when user has LEGAL_ENTITY role', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, ['user']);
    userBackend(server, {
      role: { type: 'LEGAL_ENTITY', code: '12345678', name: 'Acme OÜ' },
    });
    initializeComponent();
    history.push('/account');
  });

  test('does not render the person account page', async () => {
    expect(screen.queryByText('Hi, John Doe')).not.toBeInTheDocument();
  });

  test('renders the legal entity account page', async () => {
    expect(await screen.findByRole('region', { name: 'legal-entity-account' })).toBeInTheDocument();
  });
});
