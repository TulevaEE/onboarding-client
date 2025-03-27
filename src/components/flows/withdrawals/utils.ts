import { captureException } from '@sentry/browser';
import {
  FundPensionStatus,
  FundPensionOpeningMandateDetails,
  PartialWithdrawalMandateDetails,
  WithdrawalMandateDetails,
  BankAccountDetails,
  WithdrawalsEligibility,
} from '../../common/apiModels/withdrawals';
import { Fund, SourceFund, UserConversion } from '../../common/apiModels/index';
import { PensionHoldings, PersonalDetailsStepState, WithdrawalsAmountStepState } from './types';

export const canAccessWithdrawals = (
  conversion: UserConversion,
  fundPensionStatus: FundPensionStatus,
) => {
  const pendingSecondPillarWithdrawal = conversion.secondPillar.pendingWithdrawal;
  const pendingThirdPillarWithdrawal = conversion.thirdPillar.pendingWithdrawal;

  if (pendingSecondPillarWithdrawal || pendingThirdPillarWithdrawal) {
    return false;
  }

  const activeFundPensionPillars = getActiveFundPensionPillars(fundPensionStatus);

  return activeFundPensionPillars.size === 0;
};

export const getActiveFundPensionPillars = (
  fundPensionStatus: FundPensionStatus,
): Set<'SECOND' | 'THIRD'> => {
  const activeFundPensionPillars = fundPensionStatus.fundPensions
    .filter((fundPension) => fundPension.active)
    .map((fundPension) => fundPension.pillar);

  return new Set(activeFundPensionPillars);
};

export const canOnlyPartiallyWithdrawThirdPillar = (eligibility: WithdrawalsEligibility) =>
  !eligibility.hasReachedEarlyRetirementAge && !eligibility.canWithdrawThirdPillarWithReducedTax;

export const canWithdrawOnlyThirdPillarTaxFree = (eligibility: WithdrawalsEligibility) =>
  !eligibility.hasReachedEarlyRetirementAge && eligibility.canWithdrawThirdPillarWithReducedTax;

export const getYearsToGoUntilEarlyRetirementAge = (eligibility?: WithdrawalsEligibility) => {
  if (!eligibility || eligibility?.hasReachedEarlyRetirementAge) {
    return 0;
  }

  return 60 - eligibility?.age;
};

export const getWithdrawalsPath = (subPath: string) => `/withdrawals/${subPath}`;
export const getBankAccountDetails = (
  personalDetails: PersonalDetailsStepState,
): BankAccountDetails =>
  // TODO improve handling

  ({
    type: 'ESTONIAN',
    accountIban: personalDetails.bankAccountIban as string,
  });

export const getPartialWithdrawalMandatesToCreate = (
  personalDetails: PersonalDetailsStepState,
  withdrawalAmount: WithdrawalsAmountStepState,
  eligibility: WithdrawalsEligibility,
  pensionHoldings: PensionHoldings,
  funds: Fund[],
  secondPillarSourceFunds: SourceFund[],
  thirdPillarSourceFunds: SourceFund[],
): PartialWithdrawalMandateDetails[] => {
  const { singleWithdrawalAmount } = withdrawalAmount;

  if (singleWithdrawalAmount === null) {
    return [];
  }

  const fundIsinToFundNavMap: Record<string, number> = funds.reduce(
    (acc, fund) => ({
      ...acc,
      [fund.isin]: fund.nav,
    }),
    {},
  );

  const bankAccountDetails = getBankAccountDetails(personalDetails);

  const totalAvailableToWithdraw = getTotalWithdrawableAmount(
    withdrawalAmount.pillarsToWithdrawFrom,
    pensionHoldings,
  );
  const partialWithdrawalOfTotal = singleWithdrawalAmount / totalAvailableToWithdraw;

  const getWithdrawalDetails = (
    pillar: 'SECOND' | 'THIRD',
    sourceFunds: SourceFund[],
    taxResidency: string,
  ): PartialWithdrawalMandateDetails => {
    const getSourceFundTotalUnits = (fund: SourceFund) =>
      fund.price / fundIsinToFundNavMap[fund.isin];

    return {
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar,
      bankAccountDetails,
      fundWithdrawalAmounts: sourceFunds
        .filter((fund) => fund.price !== 0)
        .map((fund) => ({
          isin: fund.isin,
          percentage: Math.floor(partialWithdrawalOfTotal * 100),
          units: getSourceFundTotalUnits(fund) * partialWithdrawalOfTotal, // TODO bigdecimal <-> JS IEEE754 floating point handling
        })),
      taxResidency,
    };
  };

  const secondPillarWithdrawal = getWithdrawalDetails(
    'SECOND',
    secondPillarSourceFunds,
    personalDetails.taxResidencyCode,
  );
  const thirdPillarWithdrawal = getWithdrawalDetails(
    'THIRD',
    thirdPillarSourceFunds,
    personalDetails.taxResidencyCode,
  );

  if (
    canOnlyPartiallyWithdrawThirdPillar(eligibility) &&
    withdrawalAmount.pillarsToWithdrawFrom !== 'THIRD'
  ) {
    return [];
  }

  if (withdrawalAmount.pillarsToWithdrawFrom === 'THIRD') {
    return [thirdPillarWithdrawal];
  }

  if (withdrawalAmount.pillarsToWithdrawFrom === 'SECOND') {
    return [secondPillarWithdrawal];
  }

  return [secondPillarWithdrawal, thirdPillarWithdrawal];
};

export const getFundPensionMandatesToCreate = (
  personalDetails: PersonalDetailsStepState,
  withdrawalAmount: WithdrawalsAmountStepState,
  withdrawalsEligibility: WithdrawalsEligibility,
  pensionHoldings: PensionHoldings,
): FundPensionOpeningMandateDetails[] => {
  const totalAmount = getTotalWithdrawableAmount(
    withdrawalAmount.pillarsToWithdrawFrom,
    pensionHoldings,
  );
  if (!withdrawalAmount.fundPensionEnabled) {
    return [];
  }

  if (canOnlyPartiallyWithdrawThirdPillar(withdrawalsEligibility)) {
    return [];
  }

  if (totalAmount === withdrawalAmount.singleWithdrawalAmount) {
    return [];
  }

  const bankAccountDetails = getBankAccountDetails(personalDetails);

  const secondPillarWithdrawal: FundPensionOpeningMandateDetails = {
    mandateType: 'FUND_PENSION_OPENING',
    pillar: 'SECOND',
    bankAccountDetails,
    duration: {
      durationYears: withdrawalsEligibility.recommendedDurationYears,
      recommendedDuration: true,
    },
  };

  const thirdPillarWithdrawal: FundPensionOpeningMandateDetails = {
    mandateType: 'FUND_PENSION_OPENING',
    pillar: 'THIRD',
    bankAccountDetails,
    duration: {
      durationYears: withdrawalsEligibility.recommendedDurationYears,
      recommendedDuration: true,
    },
  };

  if (withdrawalAmount.pillarsToWithdrawFrom === 'THIRD') {
    return [thirdPillarWithdrawal];
  }

  if (withdrawalAmount.pillarsToWithdrawFrom === 'SECOND') {
    return [secondPillarWithdrawal];
  }

  return [secondPillarWithdrawal, thirdPillarWithdrawal];
};

export const getMandatesToCreate = ({
  personalDetails,
  pensionHoldings,
  amountStep,
  eligibility,
  funds,
  secondPillarSourceFunds,
  thirdPillarSourceFunds,
}: {
  personalDetails: PersonalDetailsStepState;
  pensionHoldings: PensionHoldings;
  amountStep: WithdrawalsAmountStepState;
  eligibility: WithdrawalsEligibility | null;
  funds: Fund[] | null;
  secondPillarSourceFunds: SourceFund[] | null;
  thirdPillarSourceFunds: SourceFund[] | null;
}): WithdrawalMandateDetails[] | null => {
  if (
    !eligibility ||
    !pensionHoldings ||
    !funds ||
    secondPillarSourceFunds === null ||
    thirdPillarSourceFunds === null
  ) {
    return null;
  }

  return [
    ...getFundPensionMandatesToCreate(personalDetails, amountStep, eligibility, pensionHoldings),
    ...getPartialWithdrawalMandatesToCreate(
      personalDetails,
      amountStep,
      eligibility,
      pensionHoldings,
      funds,
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
    ),
  ];
};

export const getEstimatedTotalFundPension = ({
  totalWithdrawableAmount,
  durationYears,
  singleWithdrawalAmount,
}: {
  totalWithdrawableAmount: number;
  durationYears: number;
  singleWithdrawalAmount: number | null;
}) => {
  const fundPensionSize = totalWithdrawableAmount - (singleWithdrawalAmount ?? 0);
  const fundPensionPeriods = durationYears * 12;

  const fundPensionMonthlyPaymentApproximateSize = fundPensionSize / fundPensionPeriods;
  const fundPensionPercentageLiquidatedMonthly = 1 / fundPensionPeriods;

  return { fundPensionMonthlyPaymentApproximateSize, fundPensionPercentageLiquidatedMonthly };
};

export const getAllFundNavsPresent = (
  funds: Fund[],
  secondPillarSourceFunds: SourceFund[],
  thirdPillarSourceFunds: SourceFund[],
) => {
  const fundIsinToFundNavMap: Record<string, number> = funds.reduce(
    (acc, fund) => ({
      ...acc,
      [fund.isin]: fund.nav,
    }),
    {},
  );

  const navPresent = (fund: SourceFund) =>
    Object.prototype.hasOwnProperty.call(fundIsinToFundNavMap, fund.isin) &&
    typeof fundIsinToFundNavMap[fund.isin] === 'number';

  const allFunds = [...secondPillarSourceFunds, ...thirdPillarSourceFunds];
  const allNavsPresent = allFunds.every(navPresent);

  if (funds.length > 0 && !allNavsPresent) {
    const missingFunds = allFunds
      .filter((fund) => !navPresent(fund))
      .map(({ activeFund, name, isin, price }) => ({ activeFund, name, isin, price }));
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(missingFunds));
    captureException(new Error(`Some withdrawal NAVs are missing ${JSON.stringify(missingFunds)}`));
  }

  return allNavsPresent;
};

export const getSingleWithdrawalTaxAmount = (
  withdrawalAmount: number | null,
  eligibility: WithdrawalsEligibility,
) => {
  if (withdrawalAmount === null) {
    return null;
  }

  const INCOME_TAX_RATE = getSingleWithdrawalTaxRate(eligibility);

  return withdrawalAmount * INCOME_TAX_RATE;
};

export const getSingleWithdrawalTaxRate = (eligibility: WithdrawalsEligibility) => {
  if (canOnlyPartiallyWithdrawThirdPillar(eligibility)) {
    return 0.22;
  }

  return 0.1;
};

export const getFundPensionMonthlyPaymentEstimation = (
  withdrawalAmount: WithdrawalsAmountStepState,
  eligibility: WithdrawalsEligibility,
  pensionHoldings: PensionHoldings,
) => {
  const totalAmount = getTotalWithdrawableAmount(
    withdrawalAmount.pillarsToWithdrawFrom,
    pensionHoldings,
  );

  const { fundPensionMonthlyPaymentApproximateSize, fundPensionPercentageLiquidatedMonthly } =
    getEstimatedTotalFundPension({
      totalWithdrawableAmount: totalAmount,
      durationYears: eligibility.recommendedDurationYears,
      singleWithdrawalAmount: withdrawalAmount.singleWithdrawalAmount,
    });

  const maxFundPension = getEstimatedTotalFundPension({
    totalWithdrawableAmount: totalAmount,
    durationYears: eligibility.recommendedDurationYears,
    singleWithdrawalAmount: 0,
  });

  return {
    estimatedMonthlyPayment: fundPensionMonthlyPaymentApproximateSize,
    maxMonthlyPayment: maxFundPension.fundPensionMonthlyPaymentApproximateSize,
    percentageLiquidatedMonthly: fundPensionPercentageLiquidatedMonthly,
  };
};

export const getTotalWithdrawableAmount = (
  pillarToWithdrawFrom: 'SECOND' | 'THIRD' | 'BOTH',
  holdings: PensionHoldings,
) => {
  if (pillarToWithdrawFrom === 'SECOND') {
    return holdings.totalSecondPillar;
  }

  if (pillarToWithdrawFrom === 'THIRD') {
    return holdings.totalThirdPillar;
  }

  return holdings.totalBothPillars;
};

export const getPillarRatios = (
  holdings: PensionHoldings,
  totalAvailableToWithdraw: number,
): Record<'SECOND' | 'THIRD', number> => ({
  SECOND: holdings.totalSecondPillar / totalAvailableToWithdraw,
  THIRD: holdings.totalThirdPillar / totalAvailableToWithdraw,
});

export const getSingleWithdrawalEstimateAfterTax = (
  withdrawalAmount: number | null,
  eligibility: WithdrawalsEligibility,
) => {
  const taxAmount = getSingleWithdrawalTaxAmount(withdrawalAmount, eligibility);
  if (withdrawalAmount === null || taxAmount == null) {
    return null;
  }

  return withdrawalAmount - taxAmount;
};
