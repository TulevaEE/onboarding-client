import { setupServer } from 'msw/node';
import { waitFor, screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import userEvent from '@testing-library/user-event';
import { initializeConfiguration } from '../../../config/config';
import LoggedInApp from '../../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import {
  fundPensionStatusBackend,
  pensionAccountStatementBackend,
  userConversionBackend,
  useTestBackendsExcept,
  withdrawalsEligibilityBackend,
} from '../../../../test/backend';
import { assertFundPensionCalculations, assertTotalTaxText, nextButton } from './utils';

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

describe('redirect gatekeep to prevent duplicate applications', () => {
  beforeEach(async () => {
    initializeConfiguration();

    useTestBackendsExcept(server, ['fundPensionStatus', 'userConversion']);
    initializeComponent();

    history.push('/withdrawals');
  });
  describe('pending withdrawal', () => {
    test('redirects to account page when a second pillar withdrawal is pending', async () => {
      userConversionBackend(
        server,
        {
          pendingWithdrawal: true,
        },
        { pendingWithdrawal: false },
      );
      fundPensionStatusBackend(server);
      await waitFor(() => {
        expect(history.location.pathname).toBe('/account');
      });
    });

    test('redirects to account page when a third pillar withdrawal is pending', async () => {
      userConversionBackend(
        server,
        {
          pendingWithdrawal: false,
        },
        { pendingWithdrawal: true },
      );
      fundPensionStatusBackend(server);
      await waitFor(() => {
        expect(history.location.pathname).toBe('/account');
      });
    });
  });

  describe('open fund pension', () => {
    test('redirects to account page when a second pillar fund pension is active', async () => {
      userConversionBackend(server);
      fundPensionStatusBackend(server, {
        fundPensions: [
          {
            pillar: 'SECOND',
            startDate: '2019-10-01T12:13:27.141Z',
            endDate: null,
            active: true,
            durationYears: 20,
          },
        ],
      });
      await waitFor(() => {
        expect(history.location.pathname).toBe('/account');
      });
    });

    test('redirects to account page when a third pillar fund pension is active', async () => {
      userConversionBackend(server);
      fundPensionStatusBackend(server, {
        fundPensions: [
          {
            pillar: 'THIRD',
            startDate: '2019-10-01T12:13:27.141Z',
            endDate: null,
            active: true,
            durationYears: 20,
          },
        ],
      });
      await waitFor(() => {
        expect(history.location.pathname).toBe('/account');
      });
    });
  });
});
