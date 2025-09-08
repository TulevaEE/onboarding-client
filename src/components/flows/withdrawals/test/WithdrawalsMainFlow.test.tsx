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
  assertDoneScreenSecondPillarWarning,
  assertFundPensionCalculations,
  assertFundPensionMandate,
  assertMandateCount,
  assertPartialWithdrawalCalculations,
  assertPartialWithdrawalMandate,
  confirmAndSignAndAssertDone,
  enterIban,
  fundPensionCheckbox,
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

describe('withdrawals flow with both pillars', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server);
    withdrawalsEligibilityBackend(server);
  });

  test('reaches final confirmation step to make partial withdrawal with fund pension', async () => {
    expect(await screen.findByText(/60 years old/i)).toBeInTheDocument();
    expect(await screen.findByText(/under preferential conditions/i)).toBeInTheDocument();
    expect(screen.queryByText(/you might receive/i)).not.toBeInTheDocument();

    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i),
    ).toBeInTheDocument();

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~503 € per month' });

    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '20000');
    assertPartialWithdrawalCalculations({
      amount: '20 000.00 €',
      taxAmount: '−2 000.00 €',
    });

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~420 € per month' });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    expect(await screen.findByText(/Citadele pank/)).toBeInTheDocument();
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
    expect(await screen.findByText(/Citadele pank/)).toBeInTheDocument();
    expect(await screen.findByText('EST')).toBeInTheDocument();

    assertMandateCount(4);

    await assertFundPensionMandate('SECOND', '400 €');
    await assertFundPensionMandate('THIRD', '20 €');

    await assertPartialWithdrawalMandate({
      pillar: 'SECOND',
      rows: [
        {
          fundName: 'Tuleva World Stocks Pension Fund',
          liquidationAmount: '16%',
        },
        {
          fundName: 'Swedbank Pension Fund K60',
          liquidationAmount: '16%',
        },
      ],
      amount: '17 150 €',
    });

    await assertPartialWithdrawalMandate({
      pillar: 'THIRD',
      rows: [
        {
          fundName: 'Tuleva III Samba Pensionifond',
          liquidationAmount: '1208.00 units',
        },
      ],
      amount: '850 €',
    });

    await confirmAndSignAndAssertDone();

    assertDoneScreenFundPension();
    assertDoneScreenPartialWithdrawal('SECOND');
    assertDoneScreenPartialWithdrawal('THIRD');
    assertDoneScreenSecondPillarWarning();
  }, 20_000);

  test('reaches final confirmation step with only fund pension', async () => {
    expect(await screen.findByText(/60 years old/i)).toBeInTheDocument();
    expect(await screen.findByText(/under preferential conditions/i)).toBeInTheDocument();
    expect(screen.queryByText(/you might receive/i)).not.toBeInTheDocument();

    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i),
    ).toBeInTheDocument();

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~503 € per month' });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
    expect(await screen.findByText('EST')).toBeInTheDocument();

    assertMandateCount(2);

    await assertFundPensionMandate('SECOND', '479 €');
    await assertFundPensionMandate('THIRD', '24 €');

    await confirmAndSignAndAssertDone();

    assertDoneScreenFundPension();
    assertDoneScreenSecondPillarWarning();
  }, 20_000);

  test('reaches final confirmation step with only single withdrawal', async () => {
    expect(await screen.findByText(/60 years old/i)).toBeInTheDocument();
    expect(await screen.findByText(/under preferential conditions/i)).toBeInTheDocument();
    expect(screen.queryByText(/you might receive/i)).not.toBeInTheDocument();

    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i),
    ).toBeInTheDocument();

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~503 € per month' });

    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '120699.36'); // max amount
    assertPartialWithdrawalCalculations({
      amount: '120 699.36 €',
      taxAmount: '−12 069.94 €',
    });

    await assertFundPensionCalculations({ fundPensionMonthlySize: '0 € per month' });
    userEvent.click(await fundPensionCheckbox());
    await assertFundPensionCalculations({ fundPensionMonthlySize: '0 € per month' });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
    expect(await screen.findByText('EST')).toBeInTheDocument();

    assertMandateCount(2);

    await assertPartialWithdrawalMandate({
      pillar: 'SECOND',
      rows: [
        {
          fundName: 'Tuleva World Stocks Pension Fund',
          liquidationAmount: '100%',
        },
        {
          fundName: 'Swedbank Pension Fund K60',
          liquidationAmount: '100%',
        },
      ],
      amount: '103 500 €', // 115 000 - 10% tax
    });

    await assertPartialWithdrawalMandate({
      pillar: 'THIRD',
      rows: [
        {
          fundName: 'Tuleva III Samba Pensionifond',
          liquidationAmount: '7294.00 units', // 5699.36 / nav 0.7813
        },
      ],
      amount: '5 129 €', // 5699.36 - 10% tax
    });

    await confirmAndSignAndAssertDone();

    assertDoneScreenPartialWithdrawal('SECOND');
    assertDoneScreenPartialWithdrawal('THIRD');
    assertDoneScreenSecondPillarWarning();
  }, 20_000);

  test('reaches final confirmation step with iban validation', async () => {
    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '100');

    userEvent.click(nextButton());

    const ibanInput = await screen.findByLabelText('Bank account number (IBAN)');

    userEvent.type(ibanInput, 'EE123_INVALID_IBAN');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(
        /The entered IBAN is incorrect. An Estonian IBAN has 20 characters./i,
      ),
    ).toBeInTheDocument();

    userEvent.clear(ibanInput);

    userEvent.type(ibanInput, 'EE591254471322749514');

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
  }, 20_000);

  test('can click on link to go to previous step', async () => {
    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '100');
    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    const withdrawalSizeStep = await screen.findByRole('link', { name: 'Withdrawal amount' });

    userEvent.click(withdrawalSizeStep);
    userEvent.click(await singleWithdrawalCheckbox());

    expect(await partialWithdrawalSizeInput()).toBeInTheDocument();
  }, 20_000);

  test('uses only second pillar with partial withdrawal', async () => {
    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i),
    ).toBeInTheDocument();

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~503 € per month' });

    userEvent.click(await screen.findByLabelText(/Withdraw only from II pillar/i));

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~479 € per month' });

    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '20000');
    assertPartialWithdrawalCalculations({
      amount: '20 000.00 €',
      taxAmount: '−2 000.00 €',
    });

    const finalFundPensionSize = '396 €';
    await assertFundPensionCalculations({
      fundPensionMonthlySize: `~${finalFundPensionSize} per month`,
    });
    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(2);

    await assertFundPensionMandate('SECOND', finalFundPensionSize);

    await assertPartialWithdrawalMandate({
      pillar: 'SECOND',
      rows: [
        {
          fundName: 'Tuleva World Stocks Pension Fund',
          liquidationAmount: '17%',
        },
        {
          fundName: 'Swedbank Pension Fund K60',
          liquidationAmount: '17%',
        },
      ],
      amount: '18 000 €',
    });

    await confirmAndSignAndAssertDone();
  }, 20_000);

  test('uses only second pillar without partial withdrawal', async () => {
    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i),
    ).toBeInTheDocument();

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~503 € per month' });

    userEvent.click(await screen.findByLabelText(/Withdraw only from II pillar/i));

    const finalFundPensionSize = '479 €';
    await assertFundPensionCalculations({
      fundPensionMonthlySize: `~${finalFundPensionSize} per month`,
    });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(1);

    await assertFundPensionMandate('SECOND', finalFundPensionSize);

    await confirmAndSignAndAssertDone('SINGLE_APPLICATION');
  }, 20_000);

  test('uses only third pillar with partial withdrawal ', async () => {
    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i),
    ).toBeInTheDocument();

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~503 € per month' });

    userEvent.click(await screen.findByLabelText(/Withdraw only from III pillar/i));

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~24 € per month' });

    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '1000');
    assertPartialWithdrawalCalculations({ amount: '1 000.00 €', taxAmount: '−100.00 €' });

    const finalFundPensionSize = '20 €';
    await assertFundPensionCalculations({
      fundPensionMonthlySize: `~${finalFundPensionSize} per month`,
    });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(2);

    await assertFundPensionMandate('THIRD', finalFundPensionSize);

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
  }, 20_000);

  test('uses only third pillar without partial withdrawal ', async () => {
    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i),
    ).toBeInTheDocument();

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~503 € per month' });

    userEvent.click(await screen.findByLabelText(/Withdraw only from III pillar/i));

    const finalFundPensionSize = '24 €';
    await assertFundPensionCalculations({
      fundPensionMonthlySize: `~${finalFundPensionSize} per month`,
    });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(1);
    await assertFundPensionMandate('THIRD', finalFundPensionSize);

    await confirmAndSignAndAssertDone('SINGLE_APPLICATION');
  }, 20_000);
});

describe('withdrawals flow with only second pillar and arrests/bankruptcy', () => {
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
          nav: 1,
        },
        value: 15000.0,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: false,
        contributions: 12345.67,
        subtractions: 0,
        profit: 2654.33,
        units: 15000,
      },
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
        value: 100000,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: true,
        contributions: 112233.44,
        subtractions: 0,
        profit: -12233.44,
        units: 100000,
      },

      {
        fund: {
          fundManager: { name: 'Nordea' },
          isin: 'EE1000000000',
          name: 'Nordea Liquidated fund',
          managementFeeRate: 0.0083,
          pillar: 2,
          ongoingChargesFigure: 0.0065,
          status: 'LIQUIDATED',
          inceptionDate: '2017-01-01',
          nav: 1,
        },
        value: 0,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: true,
        contributions: 112233.44,
        subtractions: 0,
        profit: -12233.44,
        units: 0,
      },
    ]);
    withdrawalsEligibilityBackend(server, {
      age: 60,
      hasReachedEarlyRetirementAge: true,
      canWithdrawThirdPillarWithReducedTax: true,
      recommendedDurationYears: 20,
      arrestsOrBankruptciesPresent: true,
    });
  });

  test('reaches final confirmation step', async () => {
    expect(
      await screen.findByText(/Your holdings in II pillar/i, { exact: false }),
    ).toBeInTheDocument();

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~479 € per month' });

    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '50000');
    assertPartialWithdrawalCalculations({
      amount: '50 000.00 €',
      taxAmount: '−5 000.00 €',
    });

    await assertFundPensionCalculations({ fundPensionMonthlySize: '~271 € per month' });

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(2);

    assertFundPensionMandate('SECOND', '271 €', 'BANKRUPTCIES_ARRESTS_PRESENT');
    assertPartialWithdrawalMandate({
      pillar: 'SECOND',
      rows: [
        {
          fundName: 'Tuleva World Stocks Pension Fund',
          liquidationAmount: '43%',
        },
        {
          fundName: 'Swedbank Pension Fund K60',
          liquidationAmount: '43%',
        },
      ],
      amount: '45 000 €',
      bankruptciesPresent: 'BANKRUPTCIES_ARRESTS_PRESENT',
    });

    await confirmAndSignAndAssertDone();
  });
});

describe('withdrawals flow with only third pillar', () => {
  beforeEach(() => {
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
          nav: 0.7813,
        },
        value: 5699.36,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: true,
        contributions: 9876.54,
        subtractions: 0,
        profit: -1876.54,
        units: 5699.36 / 0.7813, // value from mocked funds backend,
      },
    ]);
    withdrawalsEligibilityBackend(server);
  });

  test('reaches final confirmation step', async () => {
    expect(
      await screen.findByText(/Your holdings in III pillar/i, { exact: false }),
    ).toBeInTheDocument();

    userEvent.click(await singleWithdrawalCheckbox());
    userEvent.type(await partialWithdrawalSizeInput(), '100');

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(2);

    assertFundPensionMandate('THIRD', '23 €');
    assertPartialWithdrawalMandate({
      pillar: 'THIRD',
      rows: [
        {
          fundName: 'Tuleva III Samba Pensionifond',
          liquidationAmount: '127.00 units',
        },
      ],
      amount: '90 €',
    });

    await confirmAndSignAndAssertDone();
  });
});
