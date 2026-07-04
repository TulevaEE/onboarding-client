import moment from 'moment';
import { setupServer } from 'msw/node';
import { screen, within } from '@testing-library/react';
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
  assertDoneScreenSecondPillarWarning,
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
  test('with only second pillar can not proceed', async () => {
    pensionAccountStatementBackend(server, [
      {
        fund: {
          fundManager: { name: 'Swedbank' },
          isin: 'EE3600019758',
          name: 'Swedbank Pension Fund K60',
          managementFeeRate: 0.0083,
          pillar: 2,
          ongoingChargesFigure: 0.0065,
          status: 'ACTIVE',
          inceptionDate: '2017-01-01',
          nav: 1,
        },
        value: 10000,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: true,
        contributions: 112233.44,
        subtractions: 0,
        profit: -12233.44,
        units: 10000,
      },
    ]);
    withdrawalsEligibilityBackend(server, {
      age: 25,
      hasReachedEarlyRetirementAge: false,
      canWithdrawThirdPillarWithReducedTax: false,
      canWithdrawThirdPillarWithReducedTaxFrom: '2061-06-01',
      earlyRetirementDate: '2061-06-01',
      recommendedDurationYears: 55,
      arrestsOrBankruptciesPresent: false,
    });
    expect(await screen.findByText(/25 years old/i)).toBeInTheDocument();
    expect(
      await screen.findByText(
        /You will be able to use your II pillar holdings under preferential conditions in 35 years./i,
      ),
    ).toBeInTheDocument();

    expect(await screen.findByText(/Your holdings in II pillar/i)).toBeInTheDocument();

    userEvent.type(await partialWithdrawalSizeInput('22%'), '10000');
    assertPartialWithdrawalCalculations({
      amount: '10 000.00 €',
      taxAmount: '−2 200.00 €',
      assertSummaryBox: false,
      taxRate: '22%',
    });

    expect(nextButton()).toBeDisabled();

    userEvent.click(nextButton());

    expect(await screen.findByText(/Your holdings in II pillar/i)).toBeInTheDocument();
  });

  test('pre-2021 third pillar joiner sees preferential access from age 55', async () => {
    pensionAccountStatementBackend(server);
    withdrawalsEligibilityBackend(server, {
      age: 34,
      hasReachedEarlyRetirementAge: false,
      canWithdrawThirdPillarWithReducedTax: false,
      canWithdrawThirdPillarWithReducedTaxFrom: moment().add(21, 'years').format('YYYY-MM-DD'),
      earlyRetirementDate: moment().add(26, 'years').format('YYYY-MM-DD'),
      recommendedDurationYears: 20 + (60 - 34),
      arrestsOrBankruptciesPresent: false,
    });

    expect(await screen.findByText(/34 years old/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/eligible to start using your III pillar holdings/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/in 21 years/)).toBeInTheDocument();
    expect(
      await screen.findByText(/Before the age of 55, withdrawing money is only worth doing for/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        /You will be able to use your II pillar holdings under preferential conditions when you are 60 years old./i,
      ),
    ).toBeInTheDocument();
  });

  test('with second and third pillar, can only withdraw third pillar', async () => {
    pensionAccountStatementBackend(server);
    withdrawalsEligibilityBackend(server, {
      age: 25,
      hasReachedEarlyRetirementAge: false,
      canWithdrawThirdPillarWithReducedTax: false,
      canWithdrawThirdPillarWithReducedTaxFrom: '2061-06-01',
      earlyRetirementDate: '2061-06-01',
      recommendedDurationYears: 20 + (60 - 25),
      arrestsOrBankruptciesPresent: false,
    });

    expect(await screen.findByText(/25 years old/i)).toBeInTheDocument();
    expect(
      await screen.findByText(
        /eligible to start using your accumulated holdings under preferential conditions/i,
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText(/in 35 years/i)).toBeInTheDocument();

    expect(
      await screen.findByText(/Before the age of 60, you can withdraw money only from/i),
    ).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText(/Withdraw only from II pillar/i));

    expect(
      await screen.findByText(/Withdraw only from III pillar/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    userEvent.type(await partialWithdrawalSizeInput('22%'), '1000');
    assertPartialWithdrawalCalculations({
      amount: '1 000.00 €',
      taxAmount: '−220.00 €',
      taxRate: '22%',
      assertSummaryBox: false,
    });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
    expect(await screen.findByText('EST')).toBeInTheDocument();

    await assertMandateCount(1);

    await assertPartialWithdrawalMandate({
      pillar: 'THIRD',
      rows: [
        {
          fundName: 'Tuleva III Samba Pensionifond',
          liquidationAmount: '1279.00 units',
        },
      ],
      amount: '780 €',
      taxRate: '22%',
    });

    await confirmAndSignAndAssertDone('SINGLE_APPLICATION');

    assertDoneScreenPartialWithdrawal('THIRD');
  });

  test('with only third pillar, can withdraw', async () => {
    pensionAccountStatementBackend(server, [
      {
        fund: {
          fundManager: { name: 'Tuleva' },
          isin: 'EE3600001707',
          name: 'Tuleva III Samba Pensionifond',
          managementFeeRate: 0.003,
          pillar: 3,
          ongoingChargesFigure: 0.0043,
          status: 'ACTIVE',
          inceptionDate: '2017-01-01',
          nav: 0.7813, // value from funds backend mock, that one is used instead
        },
        value: 5699.36,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: true,
        contributions: 9876.54,
        subtractions: 0,
        profit: -1876.54,
        units: 5699.36 / 0.7813,
      },
    ]);
    withdrawalsEligibilityBackend(server, {
      age: 25,
      hasReachedEarlyRetirementAge: false,
      canWithdrawThirdPillarWithReducedTax: false,
      canWithdrawThirdPillarWithReducedTaxFrom: '2061-06-01',
      earlyRetirementDate: '2061-06-01',
      recommendedDurationYears: 20 + (60 - 25),
      arrestsOrBankruptciesPresent: false,
    });

    expect(await screen.findByText(/25 years old/i)).toBeInTheDocument();
    expect(
      await screen.findByText(
        /eligible to start using your accumulated holdings under preferential conditions/i,
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText(/in 35 years/i)).toBeInTheDocument();

    expect(
      await screen.findByText(/Before the age of 60, withdrawing money is only worth doing for/i),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Your holdings in III pillar/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    userEvent.type(await partialWithdrawalSizeInput('22%'), '1000');
    assertPartialWithdrawalCalculations({
      amount: '1 000.00 €',
      taxAmount: '−220.00 €',
      taxRate: '22%',
      assertSummaryBox: false,
    });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
    expect(await screen.findByText('EST')).toBeInTheDocument();

    await assertMandateCount(1);

    await assertPartialWithdrawalMandate({
      pillar: 'THIRD',
      rows: [
        {
          fundName: 'Tuleva III Samba Pensionifond',
          liquidationAmount: '1279.00 units',
        },
      ],
      amount: '780 €',
      taxRate: '22%',
    });

    await confirmAndSignAndAssertDone('SINGLE_APPLICATION');

    assertDoneScreenPartialWithdrawal('THIRD');
  });
});

describe('withdrawals flow at 61 with third pillar held under 5 years', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server);
    withdrawalsEligibilityBackend(server, {
      age: 61,
      hasReachedEarlyRetirementAge: true,
      canWithdrawThirdPillarWithReducedTax: false,
      canWithdrawThirdPillarWithReducedTaxFrom: moment().add(2, 'years').format('YYYY-MM-DD'),
      earlyRetirementDate: '2024-10-01',
      recommendedDurationYears: 20,
      arrestsOrBankruptciesPresent: false,
    });
  });

  test('shows the full tax note and a holdings-blended tax rate when withdrawing from both pillars', async () => {
    expect(
      await screen.findByText(/If you withdraw from the III pillar right away/i),
    ).toBeInTheDocument();

    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput('22%'), '10000');

    assertPartialWithdrawalCalculations({
      amount: '10 000.00 €',
      taxAmount: '−1 683.92 €',
      taxRate: '17%',
    });

    const summaryBox = await screen.findByRole('region', { name: /Withdrawal summary/i });
    expect(within(summaryBox).getByText('From the III pillar')).toBeInTheDocument();
    expect(within(summaryBox).getByText('5 699.36 €')).toBeInTheDocument();
    expect(within(summaryBox).getByText('From the II pillar')).toBeInTheDocument();
    expect(within(summaryBox).getByText('4 300.64 €')).toBeInTheDocument();
    expect(
      await within(summaryBox).findByText(/^Withdrawing from the II pillar/i),
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
      canWithdrawThirdPillarWithReducedTaxFrom: '2025-01-01',
      earlyRetirementDate: '2061-06-01',
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

    await assertFundPensionCalculations({
      fundPensionMonthlySize: '19 € per month',
      liquidatedMonthlyPercentage: '0.33%',
      returnsRegex: /will earn returns for the next 25 years/i,
    });

    userEvent.type(await partialWithdrawalSizeInput(), '1000');
    assertPartialWithdrawalCalculations({ amount: '1 000.00 €', taxAmount: '−100.00 €' });

    await assertFundPensionCalculations({
      fundPensionMonthlySize: '16 € per month',
      liquidatedMonthlyPercentage: '0.33%',
      returnsRegex: /will earn returns for the next 25 years/i,
    });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
    expect(await screen.findByText('EST')).toBeInTheDocument();

    await assertMandateCount(2);

    await assertFundPensionMandate('THIRD', '16 €');
    await assertPartialWithdrawalMandate({
      pillar: 'THIRD',
      rows: [
        {
          fundName: 'Tuleva III Samba Pensionifond',
          liquidationAmount: '1279.00 units',
        },
      ],
      amount: '900 €',
    });

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
          nav: 0.87831,
        },
        value: 15000.0,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: false,
        contributions: 12345.67,
        subtractions: 0,
        profit: 2654.33,
        units: 15000 / 0.87831, // cross reference to funds backend responses,
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

    await assertMandateCount(1);

    await confirmAndSignAndAssertFailed();
  });
});

describe('withdrawals flow with unliquidatable fund', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server, [
      {
        fund: {
          fundManager: { name: 'Tuleva' },
          isin: 'EE3600109435',
          name: 'Tuleva World Stocks Pension Fund',
          managementFeeRate: 0.0034,
          pillar: 2,
          ongoingChargesFigure: 0.0039,
          status: 'ACTIVE',
          inceptionDate: '2017-01-01',
          nav: 0.87831,
        },
        value: 100000,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: false,
        contributions: 12345.67,
        subtractions: 0,
        profit: 2654.33,
        units: 100000 / 0.87831, // cross-referenced from fund backend, those values are actually used
      },
      {
        fund: {
          fundManager: { name: 'Swedbank' },
          isin: 'EE3600019758',
          name: 'Swedbank Pension Fund K60 (väljumine piiratud)',
          managementFeeRate: 0.0083,
          pillar: 2,
          ongoingChargesFigure: 0.0065,
          status: 'ACTIVE',
          inceptionDate: '2017-01-01',
          nav: 1.46726,
        },
        value: 100000,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: true,
        contributions: 112233.44,
        subtractions: 0,
        profit: -12233.44,
        units: 15000 / 1.46726,
      },
      {
        fund: {
          fundManager: { name: 'Tuleva' },
          isin: 'EE3600001707',
          name: 'Tuleva III Samba Pensionifond',
          managementFeeRate: 0.003,
          pillar: 3,
          ongoingChargesFigure: 0.0043,
          status: 'ACTIVE',
          inceptionDate: '2017-01-01',
          nav: 0.7813, // cross-referenced from fund backend, those values are actually used
        },
        value: 5699.36,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: true,
        contributions: 9876.54,
        subtractions: 0,
        profit: -1876.54,
        units: 5699.36 / 0.7813,
      },
    ]);
    withdrawalsEligibilityBackend(server);
  });

  test('does not liquidate unliquidatable funds', async () => {
    expect(await screen.findByText(/60 years old/i)).toBeInTheDocument();
    expect(await screen.findByText(/under preferential conditions/i)).toBeInTheDocument();
    expect(screen.queryByText(/you might receive/i)).not.toBeInTheDocument();

    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i),
    ).toBeInTheDocument();

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~440 € per month' });

    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '20000');
    assertPartialWithdrawalCalculations({
      amount: '20 000.00 €',
      taxAmount: '−2 000.00 €',
    });

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~357 € per month' });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
    expect(await screen.findByText('EST')).toBeInTheDocument();

    await assertMandateCount(3);

    await assertFundPensionMandate('SECOND', '357 €');

    await assertPartialWithdrawalMandate({
      pillar: 'SECOND',
      rows: [
        {
          fundName: 'Tuleva World Stocks Pension Fund',
          liquidationAmount: '14%',
        },
      ],
      amount: '12 871 €',
    });

    expect(
      within(await screen.findByTestId(`PARTIAL_WITHDRAWAL_SECOND`)).queryByText(
        /Swedbank Pension Fund K60/,
      ),
    ).not.toBeInTheDocument();

    await assertPartialWithdrawalMandate({
      pillar: 'THIRD',
      rows: [
        {
          fundName: 'Tuleva III Samba Pensionifond',
          liquidationAmount: '7294.00 units',
        },
      ],
      amount: '5 129 €',
    });

    await confirmAndSignAndAssertDone();

    assertDoneScreenFundPension();
    assertDoneScreenPartialWithdrawal('SECOND');
    assertDoneScreenPartialWithdrawal('THIRD');
    assertDoneScreenSecondPillarWarning();
  }, 20_000);
});
