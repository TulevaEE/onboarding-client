import { captureException } from '@sentry/browser';
import moment from 'moment';
import {
  FundPensionStatus,
  FundPensionOpeningMandateDetails,
  PartialWithdrawalMandateDetails,
  WithdrawalMandateDetails,
  BankAccountDetails,
  WithdrawalsEligibility,
} from '../../common/apiModels/withdrawals';
import { Fund, SourceFund, UserConversion } from '../../common/apiModels/index';
import {
  PensionHoldings,
  PersonalDetailsStepState,
  PillarToWithdrawFrom,
  WithdrawalsAmountStepState,
} from './types';

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
  if (!eligibility || eligibility.hasReachedEarlyRetirementAge) {
    return 0;
  }

  return getYearsToGoUntil(eligibility.earlyRetirementDate);
};

export const hasEarlierThirdPillarReducedTaxAccess = (eligibility: WithdrawalsEligibility) =>
  canOnlyPartiallyWithdrawThirdPillar(eligibility) &&
  !!eligibility.canWithdrawThirdPillarWithReducedTaxFrom &&
  moment(eligibility.canWithdrawThirdPillarWithReducedTaxFrom).isBefore(
    eligibility.earlyRetirementDate,
  );

const getYearsToGoUntil = (date: string) =>
  Math.max(0, Math.ceil(moment(date).diff(moment(), 'years', true)));

export const getYearsToGoUntilThirdPillarReducedTax = (eligibility: WithdrawalsEligibility) => {
  if (!eligibility.canWithdrawThirdPillarWithReducedTaxFrom) {
    return null;
  }

  return getYearsToGoUntil(eligibility.canWithdrawThirdPillarWithReducedTaxFrom);
};

export const formatTaxRatePercent = (rate: number) => Math.round(rate * 100);

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

  const withdrawalAmountsByPillar = getWithdrawalAmountsByPillar(
    singleWithdrawalAmount,
    withdrawalAmount.pillarsToWithdrawFrom,
    pensionHoldings,
  );

  const getWithdrawalDetails = (
    pillar: 'SECOND' | 'THIRD',
    sourceFunds: SourceFund[],
    taxResidency: string,
    pillarTotal: number,
  ): PartialWithdrawalMandateDetails => {
    const withdrawalFractionOfPillar =
      pillarTotal > 0 ? withdrawalAmountsByPillar[pillar] / pillarTotal : 0;

    const getSourceFundTotalUnits = (fund: SourceFund) =>
      typeof fund.units === 'number' ? fund.units : fund.price / fundIsinToFundNavMap[fund.isin];

    return {
      mandateType: 'PARTIAL_WITHDRAWAL',
      pillar,
      bankAccountDetails,
      fundWithdrawalAmounts: sourceFunds
        .filter((fund) => fund.price !== 0)
        .map((fund) => {
          const units = getSourceFundTotalUnits(fund) * withdrawalFractionOfPillar;
          return {
            isin: fund.isin,
            percentage: Math.floor(withdrawalFractionOfPillar * 100),
            units: units > 1 ? Math.floor(units) : units, // TODO bigdecimal <-> JS IEEE754 floating point handling
          };
        }),
      taxResidency,
    };
  };

  const secondPillarWithdrawal = getWithdrawalDetails(
    'SECOND',
    secondPillarSourceFunds,
    personalDetails.taxResidencyCode,
    pensionHoldings.totalSecondPillar,
  );
  const thirdPillarWithdrawal = getWithdrawalDetails(
    'THIRD',
    thirdPillarSourceFunds,
    personalDetails.taxResidencyCode,
    pensionHoldings.totalThirdPillar,
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

  return [
    ...(withdrawalAmountsByPillar.THIRD > 0 ? [thirdPillarWithdrawal] : []),
    ...(withdrawalAmountsByPillar.SECOND > 0 ? [secondPillarWithdrawal] : []),
  ];
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

  const withdrawalAmountsByPillar = getWithdrawalAmountsByPillar(
    withdrawalAmount.singleWithdrawalAmount ?? 0,
    withdrawalAmount.pillarsToWithdrawFrom,
    pensionHoldings,
  );
  const secondPillarRemainder =
    pensionHoldings.totalSecondPillar - withdrawalAmountsByPillar.SECOND;
  const thirdPillarRemainder = pensionHoldings.totalThirdPillar - withdrawalAmountsByPillar.THIRD;

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
    return thirdPillarRemainder > 0 ? [thirdPillarWithdrawal] : [];
  }

  if (withdrawalAmount.pillarsToWithdrawFrom === 'SECOND') {
    return secondPillarRemainder > 0 ? [secondPillarWithdrawal] : [];
  }

  return [
    ...(secondPillarRemainder > 0 ? [secondPillarWithdrawal] : []),
    ...(thirdPillarRemainder > 0 ? [thirdPillarWithdrawal] : []),
  ];
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
  pillarsToWithdrawFrom: PillarToWithdrawFrom,
  pensionHoldings: PensionHoldings,
) => {
  if (withdrawalAmount === null) {
    return null;
  }

  if (canOnlyPartiallyWithdrawThirdPillar(eligibility)) {
    return withdrawalAmount * getSingleWithdrawalTaxRate(eligibility, 'THIRD');
  }

  const withdrawalAmountsByPillar = getWithdrawalAmountsByPillar(
    withdrawalAmount,
    pillarsToWithdrawFrom,
    pensionHoldings,
  );

  return (
    withdrawalAmountsByPillar.SECOND * getSingleWithdrawalTaxRate(eligibility, 'SECOND') +
    withdrawalAmountsByPillar.THIRD * getSingleWithdrawalTaxRate(eligibility, 'THIRD')
  );
};

export const getSingleWithdrawalTaxRate = (
  eligibility: WithdrawalsEligibility,
  pillar: 'SECOND' | 'THIRD',
) => (pillar === 'THIRD' && !eligibility.canWithdrawThirdPillarWithReducedTax ? 0.22 : 0.1);

export const getSingleWithdrawalEffectiveTaxRate = (
  withdrawalAmount: number | null,
  eligibility: WithdrawalsEligibility,
  pillarsToWithdrawFrom: PillarToWithdrawFrom,
  pensionHoldings: PensionHoldings,
) => {
  if (canOnlyPartiallyWithdrawThirdPillar(eligibility) || pillarsToWithdrawFrom === 'THIRD') {
    return getSingleWithdrawalTaxRate(eligibility, 'THIRD');
  }

  if (pillarsToWithdrawFrom === 'SECOND') {
    return getSingleWithdrawalTaxRate(eligibility, 'SECOND');
  }

  if (!withdrawalAmount) {
    return getSingleWithdrawalTaxRate(
      eligibility,
      pensionHoldings.totalThirdPillar > 0 ? 'THIRD' : 'SECOND',
    );
  }

  return (
    (getSingleWithdrawalTaxAmount(
      withdrawalAmount,
      eligibility,
      pillarsToWithdrawFrom,
      pensionHoldings,
    ) ?? 0) / withdrawalAmount
  );
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
  pillarToWithdrawFrom: PillarToWithdrawFrom,
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

export const getWithdrawalAmountsByPillar = (
  withdrawalAmount: number,
  pillarsToWithdrawFrom: PillarToWithdrawFrom,
  holdings: PensionHoldings,
): Record<'SECOND' | 'THIRD', number> => {
  if (pillarsToWithdrawFrom === 'SECOND') {
    return { SECOND: withdrawalAmount, THIRD: 0 };
  }

  if (pillarsToWithdrawFrom === 'THIRD') {
    return { SECOND: 0, THIRD: withdrawalAmount };
  }

  const amountFromThirdPillar = Math.min(withdrawalAmount, holdings.totalThirdPillar);
  return { SECOND: withdrawalAmount - amountFromThirdPillar, THIRD: amountFromThirdPillar };
};

export const getSingleWithdrawalEstimateAfterTax = (
  withdrawalAmount: number | null,
  eligibility: WithdrawalsEligibility,
  pillarsToWithdrawFrom: PillarToWithdrawFrom,
  pensionHoldings: PensionHoldings,
) => {
  const taxAmount = getSingleWithdrawalTaxAmount(
    withdrawalAmount,
    eligibility,
    pillarsToWithdrawFrom,
    pensionHoldings,
  );
  if (withdrawalAmount === null || taxAmount == null) {
    return null;
  }

  return withdrawalAmount - taxAmount;
};

export const clampWithdrawalValue = (amount: number) => parseFloat(amount.toFixed(2));
