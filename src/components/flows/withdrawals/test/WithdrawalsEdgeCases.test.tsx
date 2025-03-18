import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { initializeConfiguration } from '../../../config/config';
import LoggedInApp from '../../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../../test/utils';
import {
  pensionAccountStatementBackend,
  useTestBackendsExcept,
  withdrawalsEligibilityBackend,
} from '../../../../test/backend';
import {
  assertDoneScreenFundPension,
  assertDoneScreenPartialWithdrawal,
  assertFundPensionCalculations,
  assertFundPensionMandate,
  assertMandateCount,
  assertPartialWithdrawalMandate,
  assertPartialWithdrawalCalculations,
  confirmAndSignAndAssertDone,
  confirmAndSignAndAssertFailed,
  enterIban,
  nextButton,
  partialWithdrawalSizeInput,
  singleWithdrawalCheckbox,
} from './utils';

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

  useTestBackendsExcept(server, ['pensionAccountStatement', 'withdrawalsEligibility']);
  initializeComponent();

  history.push('/withdrawals');
});

describe('withdrawals flow before early retirement age', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server);
    withdrawalsEligibilityBackend(server, {
      age: 25,
      hasReachedEarlyRetirementAge: false,
      canWithdrawThirdPillarWithReducedTax: false,
      recommendedDurationYears: 55,
      arrestsOrBankruptciesPresent: true,
    });
  });

  test('can only make calculations on first step and not proceed', async () => {
    expect(await screen.findByText(/25 years old/i)).toBeInTheDocument();
    expect(await screen.findByText(/in 35 years/i)).toBeInTheDocument();
    expect(await screen.findByText(/you might receive/i)).toBeInTheDocument();

    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i),
    ).toBeInTheDocument();

    await assertFundPensionCalculations(
      '~457 € per month',
      '0.38%',
      /will earn returns for the next 22 years/i,
    );

    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '20000');
    assertPartialWithdrawalCalculations('20 000.00 €', '−2 000.00 €');

    await assertFundPensionCalculations(
      '~381 € per month',
      '0.38%',
      /will earn returns for the next 22 years/i,
    );

    expect(nextButton()).toBeDisabled();

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i),
    ).toBeInTheDocument();
  });
});

describe('withdrawals flow at 55 withdrawing only third pillar', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server);
    withdrawalsEligibilityBackend(server, {
      age: 55,
      hasReachedEarlyRetirementAge: false,
      canWithdrawThirdPillarWithReducedTax: true,
      recommendedDurationYears: 5 + 20, // 5 years to go until 60 + 20 years recommended duration
      arrestsOrBankruptciesPresent: false,
    });
  });

  test('can only withdraw third pillar', async () => {
    expect(await screen.findByText(/55 years old/i)).toBeInTheDocument();

    expect(
      await screen.findByText(/eligible to start using your III pillar holdings/i),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(
        /You will be able to use your II pillar holdings under preferential conditions when you are 60 years old./i,
        undefined,
        {
          timeout: 1000,
        },
      ),
    ).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText(/Withdraw only from II pillar/i));

    expect(
      await screen.findByText(/Withdraw only from III pillar/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    await assertFundPensionCalculations(
      '19 € per month',
      '0.33%',
      /will earn returns for the next 25 years/i,
    );

    userEvent.type(await partialWithdrawalSizeInput(), '1000');
    assertPartialWithdrawalCalculations('1 000.00 €', '−100.00 €');

    await assertFundPensionCalculations(
      '16 € per month',
      '0.33%',
      /will earn returns for the next 25 years/i,
    );

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
    expect(await screen.findByText('EST')).toBeInTheDocument();

    assertMandateCount(2);

    await assertFundPensionMandate('THIRD', '16 €');
    await assertPartialWithdrawalMandate(
      'THIRD',
      [
        {
          fundName: 'Tuleva III Samba Pensionifond',
          liquidationAmount: '1279.92 units',
        },
      ],
      '900 €',
    );

    await confirmAndSignAndAssertDone();

    assertDoneScreenFundPension();
    assertDoneScreenPartialWithdrawal('THIRD');
  });
});

describe('withdrawals flow with missing NAV', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server, [
      {
        fund: {
          fundManager: { name: 'Tuleva' },
          isin: 'INVALID_NAV',
          name: 'Tuleva World Stocks Pension Fund',
          managementFeeRate: 0.0034,
          pillar: 2,
          ongoingChargesFigure: 0.0039,
          status: 'ACTIVE',
          inceptionDate: '2017-01-01',
          nav: 1,
        },
        value: 15000.0,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: false,
        contributions: 12345.67,
        subtractions: 0,
        profit: 2654.33,
      },
    ]);
    withdrawalsEligibilityBackend(server);
  });

  test('can not submit when a NAV is missing', async () => {
    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '20000');

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    assertMandateCount(4);

    await confirmAndSignAndAssertFailed();
  });
});
