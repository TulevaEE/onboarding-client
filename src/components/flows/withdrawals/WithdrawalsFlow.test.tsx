import { setupServer } from 'msw/node';
import { screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { initializeConfiguration } from '../../config/config';
import LoggedInApp from '../../LoggedInApp';
import { createDefaultStore, login, renderWrapped } from '../../../test/utils';
import {
  amlChecksBackend,
  applicationsBackend,
  fundsBackend,
  mandateBatchBackend,
  mandateDeadlinesBackend,
  pensionAccountStatementBackend,
  returnsBackend,
  smartIdMandateBatchSigningBackend,
  transactionsBackend,
  userBackend,
  userConversionBackend,
  withdrawalsEligibilityBackend,
} from '../../../test/backend';
import { FundStatus } from '../../common/apiModels';
import { WithdrawalMandateDetails } from '../../common/apiModels/withdrawals';

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

  transactionsBackend(server);
  userConversionBackend(server);
  userBackend(server);
  amlChecksBackend(server);
  fundsBackend(server);
  applicationsBackend(server);
  returnsBackend(server);
  smartIdMandateBatchSigningBackend(server);
  mandateBatchBackend(server);
  mandateDeadlinesBackend(server);

  initializeComponent();

  history.push('/withdrawals');
});
describe('withdrawals flow with both pillars', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server);
    withdrawalsEligibilityBackend(server);
  });

  test('reaches final confirmation step to make partial withdrawal with fund pension', async () => {
    expect(
      await screen.findByText(/60 years old/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/under preferential conditions/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    await assertFundPensionCalculations('502.91 € per month');

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '20000');
    assertTotalTaxText('−2 000.00 €');

    await assertFundPensionCalculations('419.58 € per month');

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    expect(await screen.findByText(/EE591254471322749514/i)).toBeInTheDocument();
    expect(await screen.findByText('EST')).toBeInTheDocument();

    assertMandateCount(4);

    await assertFundPensionMandate('SECOND', '399.77 €');
    await assertFundPensionMandate('THIRD', '19.81 €');

    await assertPartialWithdrawalMandate(
      'SECOND',
      [
        {
          fundName: 'Tuleva World Stocks Pension Fund',
          liquidationAmount: '16%',
        },
        {
          fundName: 'Swedbank Pension Fund K60',
          liquidationAmount: '16%',
        },
      ],
      '17 150 €',
    );

    await assertPartialWithdrawalMandate(
      'THIRD',
      [
        {
          fundName: 'Tuleva III Samba Pensionifond',
          liquidationAmount: '1208.74 units',
        },
      ],
      '850 €',
    );

    await confirmAndSignAndAssertDone();

    assertDoneScreenFundPension();
    assertDoneScreenPartialWithdrawal('SECOND');
    assertDoneScreenPartialWithdrawal('THIRD');
    assertDoneScreenSecondPillarWarning();
  }, 20_000);

  test('reaches final confirmation step with iban validation', async () => {
    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '100');

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
    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '100');
    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    expect(
      await screen.findByText(/I submit the following applications and am aware of their terms/i),
    ).toBeInTheDocument();

    const withdrawalSizeStep = await screen.findByRole('link', { name: 'Withdrawal size' });

    userEvent.click(withdrawalSizeStep);

    expect(
      await screen.findByLabelText('Do you wish to make a partial withdrawal immediately?', {
        exact: false,
      }),
    ).toBeInTheDocument();
  }, 20_000);

  test('uses only second pillar with partial withdrawal', async () => {
    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    await assertFundPensionCalculations('502.91 € per month');

    userEvent.click(await screen.findByLabelText(/Withdraw only from II pillar/i));

    await assertFundPensionCalculations('479.17 € per month');

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '20000');
    assertTotalTaxText('−2 000.00 €');

    const finalFundPensionSize = '395.83 €';
    await assertFundPensionCalculations(`${finalFundPensionSize} per month`);
    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(2);

    await assertFundPensionMandate('SECOND', finalFundPensionSize);

    await assertPartialWithdrawalMandate(
      'SECOND',
      [
        {
          fundName: 'Tuleva World Stocks Pension Fund',
          liquidationAmount: '17%',
        },
        {
          fundName: 'Swedbank Pension Fund K60',
          liquidationAmount: '17%',
        },
      ],
      '18 000 €',
    );

    await confirmAndSignAndAssertDone();
  }, 20_000);

  test('uses only second pillar without partial withdrawal', async () => {
    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    await assertFundPensionCalculations('502.91 € per month');

    userEvent.click(await screen.findByLabelText(/Withdraw only from II pillar/i));

    const finalFundPensionSize = '479.17 €';
    await assertFundPensionCalculations(`${finalFundPensionSize} per month`);

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(1);

    await assertFundPensionMandate('SECOND', finalFundPensionSize);

    await confirmAndSignAndAssertDone(true);
  }, 20_000);

  test('uses only third pillar with partial withdrawal ', async () => {
    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    await assertFundPensionCalculations('502.91 € per month');

    userEvent.click(await screen.findByLabelText(/Withdraw only from III pillar/i));

    await assertFundPensionCalculations('23.75 € per month');

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '1000');
    assertTotalTaxText('−100.00 €');

    const finalFundPensionSize = '19.58 €';
    await assertFundPensionCalculations(`${finalFundPensionSize} per month`);

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(2);

    await assertFundPensionMandate('THIRD', finalFundPensionSize);

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
  }, 20_000);

  test('uses only third pillar without partial withdrawal ', async () => {
    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    await assertFundPensionCalculations('502.91 € per month');

    userEvent.click(await screen.findByLabelText(/Withdraw only from III pillar/i));

    const finalFundPensionSize = '23.75 €';
    await assertFundPensionCalculations(`${finalFundPensionSize} per month`);

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(1);
    await assertFundPensionMandate('THIRD', finalFundPensionSize);

    await confirmAndSignAndAssertDone(true);
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
          status: FundStatus.ACTIVE,
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
      {
        fund: {
          fundManager: { name: 'Swedbank' },
          isin: 'EE3600019758',
          name: 'Swedbank Pension Fund K60',
          managementFeeRate: 0.0083,
          pillar: 2,
          ongoingChargesFigure: 0.0065,
          status: FundStatus.ACTIVE,
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
      },

      {
        fund: {
          fundManager: { name: 'Nordea' },
          isin: 'EE1000000000',
          name: 'Nordea Liquidated fund',
          managementFeeRate: 0.0083,
          pillar: 2,
          ongoingChargesFigure: 0.0065,
          status: FundStatus.LIQUIDATED,
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
      },
    ]);
    withdrawalsEligibilityBackend(server, {
      age: 60,
      hasReachedEarlyRetirementAge: true,
      recommendedDurationYears: 20,
      arrestsOrBankruptciesPresent: true,
    });
  });

  test('reaches final confirmation step', async () => {
    expect(
      await screen.findByText(/Your holdings in II pillar/i, { exact: false }, { timeout: 1000 }),
    ).toBeInTheDocument();

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    await assertFundPensionCalculations('479.17 € per month');

    userEvent.type(partialWithdrawalSizeInput, '50000');
    assertTotalTaxText('−5 000.00 €');

    await assertFundPensionCalculations('270.83 € per month');

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(2);

    assertFundPensionMandate('SECOND', '270.83 €', 'BANKRUPTCIES_ARRESTS_PRESENT');
    assertPartialWithdrawalMandate(
      'SECOND',
      [
        {
          fundName: 'Tuleva World Stocks Pension Fund',
          liquidationAmount: '43%',
        },
        {
          fundName: 'Swedbank Pension Fund K60',
          liquidationAmount: '43%',
        },
      ],
      '45 000 €',
      'BANKRUPTCIES_ARRESTS_PRESENT',
    );

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
          status: FundStatus.ACTIVE,
          inceptionDate: '2017-01-01',
          nav: 1,
        },
        value: 5699.36,
        unavailableValue: 0,
        currency: 'EUR',
        activeContributions: true,
        contributions: 9876.54,
        subtractions: 0,
        profit: -1876.54,
      },
    ]);
    withdrawalsEligibilityBackend(server);
  });

  test('reaches final confirmation step', async () => {
    expect(
      await screen.findByText(/Your holdings in III pillar/i, { exact: false }, { timeout: 1000 }),
    ).toBeInTheDocument();

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '100');

    userEvent.click(nextButton());

    await enterIban('EE591254471322749514');
    userEvent.click(nextButton());

    assertMandateCount(2);

    assertFundPensionMandate('THIRD', '23.33 €');
    assertPartialWithdrawalMandate(
      'THIRD',
      [
        {
          fundName: 'Tuleva III Samba Pensionifond',
          liquidationAmount: '127.99 units',
        },
      ],
      '90 €',
    );

    await confirmAndSignAndAssertDone();
  });
});

describe('withdrawals flow before early retirement age', () => {
  beforeEach(() => {
    pensionAccountStatementBackend(server);
    withdrawalsEligibilityBackend(server, {
      age: 25,
      hasReachedEarlyRetirementAge: false,
      recommendedDurationYears: 35 + 20, // 35 years to go until 60 + 20 years recommended duration
      arrestsOrBankruptciesPresent: true,
    });
  });

  test('can only make calculations on first step and not proceed', async () => {
    expect(
      await screen.findByText(/25 years old/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/in 35 years/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();

    await assertFundPensionCalculations('502.91 € per month');

    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '20000');
    assertTotalTaxText('−2 000.00 €');

    await assertFundPensionCalculations('419.58 € per month');

    expect(nextButton()).toBeDisabled();

    userEvent.click(nextButton());

    expect(
      await screen.findByText(/Withdraw from the entire pension holding/i, undefined, {
        timeout: 1000,
      }),
    ).toBeInTheDocument();
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
          status: FundStatus.ACTIVE,
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
    const partialWithdrawalSizeInput = await screen.findByLabelText(
      'Do you wish to make a partial withdrawal immediately?',
      { exact: false },
    );

    userEvent.type(partialWithdrawalSizeInput, '20000');

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

const nextButton = () => screen.getByRole('button', { name: 'Continue' });
const confirmationCheckbox = () => screen.getByRole('checkbox');
const signButton = () => screen.getByRole('button', { name: /Sign/ });

const enterIban = async (iban: string) => {
  const ibanInput = await screen.findByLabelText('Bank account number (IBAN)');
  userEvent.type(ibanInput, iban);
};

const confirmAndSignAndAssertFailed = async () => {
  userEvent.click(confirmationCheckbox());
  expect(signButton()).toBeEnabled();

  userEvent.click(signButton());

  expect(
    screen.getByText(
      /Submitting withdrawal applications failed. Please contact us: tuleva@tuleva.ee/i,
    ),
  ).toBeInTheDocument();

  expect(signButton()).toBeInTheDocument();
};

const confirmAndSignAndAssertDone = async (singleApplication = false) => {
  userEvent.click(confirmationCheckbox());
  expect(signButton()).toBeEnabled();

  userEvent.click(signButton());

  expect(
    await screen.findByRole(
      'heading',
      {
        name: singleApplication
          ? 'The application has been submitted'
          : 'The applications have been submitted',
      },
      { timeout: 10_000 },
    ),
  ).toBeInTheDocument();

  expect(
    screen.getByText(
      singleApplication
        ? /We have sent the digitally signed application to your email address./i
        : /We have sent the digitally signed applications to your email address./i,
    ),
  ).toBeInTheDocument();
};

const assertDoneScreenFundPension = () => {
  expect(
    screen.getByText(/The first monthly fund pension payment will be sent on/i),
  ).toBeInTheDocument();
};

const assertDoneScreenPartialWithdrawal = (pillar: 'SECOND' | 'THIRD') => {
  let paymentDeadline: HTMLElement;

  if (pillar === 'SECOND') {
    paymentDeadline = screen.getByText(/The partial withdrawal from II pillar will be sent on/i);
  } else {
    paymentDeadline = screen.getByText(/The partial withdrawal from III pillar will be sent on/i);
  }

  expect(within(paymentDeadline).getByText(/16 – 20 January/)).toBeInTheDocument();
};

const assertDoneScreenSecondPillarWarning = () => {
  expect(
    screen.getByText('contributions to your second pillar will stop permanently'),
  ).toBeInTheDocument();
};

const assertMandateCount = async (count: number) =>
  Promise.all(
    Array(count)
      .fill(null)
      .map(async (_, i) =>
        Promise.all([expect(await screen.findByText(`Application #${i + 1}`)).toBeInTheDocument()]),
      ),
  );

const assertFundPensionCalculations = async (fundPensionMonthlySize: string) => {
  const explanationText = screen.getByText(/Every month you will receive/i);
  expect(within(explanationText).getByText('0.42%')).toBeInTheDocument();

  expect(screen.getByText(new RegExp(fundPensionMonthlySize, 'i'))).toBeInTheDocument();
  expect(screen.getByText(/will earn returns for the next 20 years/i)).toBeInTheDocument();
};

const assertTotalTaxText = (amount: string) => {
  const taxText = screen.getByText(/Partial withdrawal will be subject to 10% income tax/i);
  expect(within(taxText).getByText(amount)).toBeInTheDocument();
};

const assertFundPensionMandate = async (
  pillar: WithdrawalMandateDetails['pillar'],
  fundPensionSize: string,
  bankruptciesPresent?: 'BANKRUPTCIES_ARRESTS_PRESENT',
) => {
  const fundPensionSection = await screen.findByTestId(`FUND_PENSION_OPENING_${pillar}`);

  if (pillar === 'SECOND') {
    expect(
      await within(fundPensionSection).findByRole('heading', {
        name: 'Monthly fund pension payments from II pillar',
      }),
    ).toBeInTheDocument();
  } else {
    expect(
      await within(fundPensionSection).findByRole('heading', {
        name: 'Monthly fund pension payments from III pillar',
      }),
    ).toBeInTheDocument();
  }

  const loader = within(fundPensionSection).queryByRole('progressbar');
  if (loader) {
    await waitForElementToBeRemoved(loader);
  }

  expect(
    within(fundPensionSection).getByText(
      /The recommended duration is calculated based on the average years left to live according to your age. Currently, it is 20 years./i,
    ),
  ).toBeInTheDocument();

  const paymentDeadline = within(fundPensionSection).getByText(/The first payment will be sent on/);

  expect(within(paymentDeadline).getByText(/16 – 20 January/)).toBeInTheDocument();
  expect(within(paymentDeadline).getByText(new RegExp(fundPensionSize))).toBeInTheDocument();

  if (pillar === 'SECOND') {
    const pillarStoppedWarning = within(fundPensionSection).getByText(
      /Upon submitting the application/,
    );
    expect(
      within(pillarStoppedWarning).getByText(/II pillar contributions will stop/),
    ).toBeInTheDocument();
    expect(within(pillarStoppedWarning).getByText(/from March 31/)).toBeInTheDocument();

    if (bankruptciesPresent) {
      expect(
        within(fundPensionSection).getByText(
          /because there is an active arrest or bankruptcy claim registered in the pension registry./,
        ),
      ).toBeInTheDocument();
    }
  }

  if (!bankruptciesPresent && pillar !== 'SECOND') {
    const cancelDeadline = within(fundPensionSection).getByText(
      /I can cancel the application until/,
    );
    expect(within(cancelDeadline).getByText(/December 31 at 21:59/)).toBeInTheDocument();
  }
};

const assertPartialWithdrawalMandate = async (
  pillar: WithdrawalMandateDetails['pillar'],
  rows: { fundName: string; liquidationAmount: string }[],
  partialWithdrawalAmount: string,
  bankruptciesPresent?: 'BANKRUPTCIES_ARRESTS_PRESENT',
) => {
  const partialWithdrawalSection = await screen.findByTestId(`PARTIAL_WITHDRAWAL_${pillar}`);

  if (pillar === 'SECOND') {
    expect(
      await within(partialWithdrawalSection).findByRole('heading', {
        name: 'Partial withdrawal from II pillar',
      }),
    ).toBeInTheDocument();
  } else {
    expect(
      await within(partialWithdrawalSection).findByRole('heading', {
        name: 'Partial withdrawal from III pillar',
      }),
    ).toBeInTheDocument();
  }

  const loader = within(partialWithdrawalSection).queryByRole('progressbar');
  if (loader) {
    await waitForElementToBeRemoved(loader);
  }

  rows.forEach(({ fundName, liquidationAmount }) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rowElement = within(partialWithdrawalSection).getByText(
      fundName,
      // eslint-disable-next-line testing-library/no-node-access
    ).parentElement!;

    expect(within(rowElement).getByText(fundName)).toBeInTheDocument();
    expect(within(rowElement).getByText(liquidationAmount)).toBeInTheDocument();
  });

  const paymentDeadline = within(partialWithdrawalSection).getByText(/The payment will be sent on/);

  if (pillar === 'SECOND') {
    expect(within(paymentDeadline).getByText(/16 – 20 January/)).toBeInTheDocument();
  } else {
    expect(within(paymentDeadline).getByText(/in four working days/)).toBeInTheDocument();
  }

  expect(within(partialWithdrawalSection).getByText(/10% income tax/)).toBeInTheDocument();

  expect(
    within(partialWithdrawalSection).getByText(new RegExp(partialWithdrawalAmount)),
  ).toBeInTheDocument();

  if (pillar === 'SECOND') {
    const pillarStoppedWarning = within(partialWithdrawalSection).getByText(
      /Upon submitting the application/,
    );
    expect(
      within(pillarStoppedWarning).getByText(/II pillar contributions will stop/),
    ).toBeInTheDocument();
    expect(within(pillarStoppedWarning).getByText(/from March 31/)).toBeInTheDocument();

    if (bankruptciesPresent) {
      expect(
        within(partialWithdrawalSection).getByText(
          /because there is an active arrest or bankruptcy claim registered in the pension registry./,
        ),
      ).toBeInTheDocument();
    }
  }
};
