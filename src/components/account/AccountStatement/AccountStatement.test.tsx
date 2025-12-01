import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import LoggedInApp from '../../LoggedInApp';
import { initializeConfiguration } from '../../config/config';
import { useTestBackendsExcept } from '../../../test/backend';

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

describe('happy path', () => {
  beforeEach(() => {
    initializeConfiguration();
    useTestBackendsExcept(server, []);

    initializeComponent();

    history.push('/account');
  });

  test('active fund badge is shown with totals', async () => {
    expect(
      await screen.findByTitle('Monthly contributions go to this fund.', {}, { timeout: 3000 }),
    ).toBeInTheDocument();

    expect(await screen.findAllByText(/115\s000.00\s€/)).toHaveLength(2);
    expect(await screen.findAllByText(/5\s699.36\s€/)).toHaveLength(2);
  });
});
