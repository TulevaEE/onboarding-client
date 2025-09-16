import { setupServer } from 'msw/node';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import moment from 'moment';
import { initializeConfiguration } from '../../../config/config';
import LoggedInApp from '../../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import { capitalEventsBackend, userBackend, useTestBackendsExcept } from '../../../../test/backend';
import { mockUser } from '../../../../test/backend-responses';

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

  useTestBackendsExcept(server, ['capitalEvents', 'user']);
  initializeComponent();

  history.push('/');
});

describe('member status box with existing membership but no bonus', () => {
  beforeEach(() => {
    capitalEventsBackend(server);
    userBackend(server);
  });

  it('renders member number and upcoming membership bonus %', async () => {
    const memberStatusRow = (await screen.findAllByTestId('status-box-row'))[2];

    expect(
      await within(memberStatusRow).findByText('You are Tuleva member no. 987'),
    ).toBeInTheDocument();
    expect(
      await within(memberStatusRow).findByText(
        /Since April 1, 2019, you earn a 0.05% annual membership bonus/,
      ),
    ).toBeInTheDocument();
  });
});

describe('member status box with existing membership and latest received membership bonus', () => {
  beforeEach(() => {
    capitalEventsBackend(server, [
      {
        date: moment().subtract(1, 'day').toISOString(),
        type: 'MEMBERSHIP_BONUS',
        value: 5,
        currency: 'EUR',
      },
      {
        date: moment().subtract(1, 'year').toISOString(),
        type: 'MEMBERSHIP_BONUS',
        value: 2,
        currency: 'EUR',
      },
    ]);
    userBackend(server);
  });

  it('renders existing membership bonus', async () => {
    const memberStatusRow = (await screen.findAllByTestId('status-box-row'))[2];

    expect(
      await within(memberStatusRow).findByText('You are Tuleva member no. 987'),
    ).toBeInTheDocument();
    expect(
      await within(memberStatusRow).findByText(/In 20\d\d, you earned a membership bonus of/),
    ).toBeInTheDocument();
    expect(await within(memberStatusRow).findByText(/5 €/)).toBeInTheDocument();
  });
});

describe('member status box with existing membership and membership bonus sale', () => {
  beforeEach(() => {
    capitalEventsBackend(server, [
      {
        date: moment().subtract(1, 'day').toISOString(),
        type: 'MEMBERSHIP_BONUS',
        value: -5,
        currency: 'EUR',
      },
      {
        date: moment().subtract(1, 'years').toISOString(),
        type: 'MEMBERSHIP_BONUS',
        value: 5,
        currency: 'EUR',
      },
    ]);
    userBackend(server);
  });

  it('renders the only the last received membership bonus', async () => {
    const memberStatusRow = (await screen.findAllByTestId('status-box-row'))[2];

    expect(
      await within(memberStatusRow).findByText('You are Tuleva member no. 987'),
    ).toBeInTheDocument();

    expect(
      await within(memberStatusRow).findByText(/In 20\d\d, you earned a membership bonus of/),
    ).toBeInTheDocument();
    expect(await within(memberStatusRow).findByText(/5 €/)).toBeInTheDocument();
  });
});

describe('member status box without membership', () => {
  beforeEach(() => {
    capitalEventsBackend(server);
    userBackend(server, {
      ...mockUser,
      memberNumber: null,
      memberJoinDate: null,
    });
  });

  it('allows to join', async () => {
    const memberStatusRow = (await screen.findAllByTestId('status-box-row'))[2];

    expect(
      await within(memberStatusRow).findByText('Not a member and not earning any membership bonus'),
    ).toBeInTheDocument();
    expect(
      await within(memberStatusRow).findByText(
        /Tuleva members earn a 0.05% annual membership bonus/,
      ),
    ).toBeInTheDocument();

    const joinButton = await within(memberStatusRow).findByRole('link', { name: 'Sign up' });
    expect(joinButton).toBeInTheDocument();

    userEvent.click(joinButton);

    expect(history.location.pathname).toBe('/join');

    expect(await screen.findByText('Join tuleva')).toBeInTheDocument();
  });
});
