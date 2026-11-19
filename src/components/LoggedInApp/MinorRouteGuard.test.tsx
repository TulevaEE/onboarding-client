import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { createMemoryHistory, MemoryHistory } from 'history';
import { Route } from 'react-router-dom';
import { initializeConfiguration } from '../config/config';
import LoggedInApp from '.';
import { createDefaultStore, login, renderWrapped } from '../../test/utils';
import { transactionsBackend, useTestBackendsExcept, userBackend } from '../../test/backend';
import { depositFromParent } from '../account/TransactionSection/fixtures';
import { mockMinor, mockUser } from '../../test/backend-responses';

const server = setupServer();
let history: MemoryHistory;

function openApp(path: string) {
  history = createMemoryHistory();
  const store = createDefaultStore(history);
  login(store);
  renderWrapped(<Route path="" component={LoggedInApp} />, history, store);
  history.push(path);
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  initializeConfiguration();
  useTestBackendsExcept(server, ['user']);
});

describe('for someone under 18 looking at their own account', () => {
  beforeEach(() => {
    userBackend(server, mockMinor);
  });

  it.each(['/savings-fund/payment', '/join', '/3rd-pillar-flow', '/capital'])(
    'brings them from %s back to their account',
    async (path) => {
      openApp(path);
      expect(await screen.findByText('Hi, Mari!')).toBeInTheDocument();
      expect(history.location.pathname).toBe('/account');
    },
  );

  it.each([
    '/account',
    '/savings-fund-transactions',
    '/3rd-pillar-transactions',
    `/transaction/${depositFromParent.id}`,
  ])('lets them open %s', async (path) => {
    transactionsBackend(server, [depositFromParent]);
    openApp(path);
    expect(await screen.findByRole('main')).toBeInTheDocument();
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(history.location.pathname).toBe(path);
  });
});

it('leaves an adult where they went', async () => {
  userBackend(server, mockUser);
  openApp('/3rd-pillar-payment');
  expect(await screen.findByRole('main')).toBeInTheDocument();
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
  expect(history.location.pathname).toBe('/3rd-pillar-payment');
});
