import { setupServer } from 'msw/node';
import { Route } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { createMemoryHistory, History } from 'history';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import { initializeConfiguration } from '../../config/config';
import {
  capitalEventsBackend,
  userBackend,
  userCapitalBackend,
  useTestBackendsExcept,
} from '../../../test/backend';
import LoggedInApp from '../../LoggedInApp';
import { capitalRowsResponse, mockUser } from '../../../test/backend-responses';

describe('Member capital table', () => {
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

    useTestBackendsExcept(server, ['userCapital', 'capitalEvents', 'user']);

    initializeComponent();

    history.push('/account');
  });

  test('member capital table is not shown by default', async () => {
    userBackend(server, mockUser);
    userCapitalBackend(server, []);
    capitalEventsBackend(server, []);

    expect(screen.queryByText('Member capital')).not.toBeInTheDocument();
  });

  test('member capital table is shown with single contribution row, with no total', async () => {
    userBackend(server, { ...mockUser, memberNumber: 123, memberJoinDate: '2020-01-01' });
    capitalEventsBackend(server, [
      {
        date: '2017-12-31',
        type: 'CAPITAL_PAYMENT',
        currency: 'EUR',
        value: 10,
      },
    ]);
    userCapitalBackend(server, [
      {
        type: 'MEMBERSHIP_BONUS',
        contributions: 1.23,
        profit: 0,
        value: 1.23,
        currency: 'EUR',
      },
    ]);
    userBackend(server, { ...mockUser, memberNumber: 123, memberJoinDate: '2020-01-01' });
    expect(await screen.findByText('Contributions')).toBeInTheDocument();
    expect(await screen.findByText('Membership bonus')).toBeInTheDocument();
    expect(screen.queryByTestId('member-capital-total')).not.toBeInTheDocument();
  });

  test('member capital table is shown with multiple contribution rows, with total', async () => {
    userBackend(server, { ...mockUser, memberNumber: 123, memberJoinDate: '2020-01-01' });
    capitalEventsBackend(server, [
      {
        date: '2017-12-31',
        type: 'CAPITAL_PAYMENT',
        currency: 'EUR',
        value: 10,
      },
    ]);
    capitalEventsBackend(server, [
      {
        date: '2017-12-31',
        type: 'CAPITAL_PAYMENT',
        currency: 'EUR',
        value: 10,
      },
    ]);
    userCapitalBackend(server, capitalRowsResponse);
    userBackend(server, { ...mockUser, memberNumber: 123, memberJoinDate: '2020-01-01' });
    expect(await screen.findByText('Contributions')).toBeInTheDocument();
    expect(await screen.findByText('Monetary contribution')).toBeInTheDocument();
    expect(await screen.findByText('Membership bonus')).toBeInTheDocument();
    expect(await screen.findByText('Work compensation')).toBeInTheDocument();
    expect(await screen.findByText('Unvested work compensation')).toBeInTheDocument();
    expect(await screen.findByTestId('member-capital-total')).toBeInTheDocument();
  });
});
