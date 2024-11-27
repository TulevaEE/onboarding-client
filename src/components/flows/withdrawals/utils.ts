import { captureException } from '@sentry/browser';
import { Fund, SourceFund } from '../../common/apiModels/index';
import { PensionHoldings, PersonalDetailsStepState, WithdrawalsAmountStepState } from './types';

import {
  FundPensionOpeningMandateDetails,
  PartialWithdrawalMandateDetails,
  WithdrawalMandateDetails,
  BankAccountDetails,
  WithdrawalsEligibility,
} from '../../common/apiModels/withdrawals';

export const getYearsToGoUntilEarlyRetirementAge = (eligibility?: WithdrawalsEligibility) => {
  if (!eligibility || eligibility?.hasReachedEarlyRetirementAge) {
    return 0;
  }

  return 60 - eligibility?.age;
};

export const decorateSimulatedEligibilityForUnderRetirementAge = (
  eligibility?: WithdrawalsEligibility,
): WithdrawalsEligibility | undefined => {
  if (!eligibility) {
    return eligibility;
  }

  if (eligibility.hasReachedEarlyRetirementAge) {
    return eligibility;
  }

  const yearsToGoUntil60 = getYearsToGoUntilEarlyRetirementAge(eligibility);

  return {
    age: 60,
    hasReachedEarlyRetirementAge: true,
    recommendedDurationYears: eligibility.recommendedDurationYears - yearsToGoUntil60,
    arrestsOrBankruptciesPresent: eligibility.arrestsOrBankruptciesPresent,
  };
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
    };
  };

  const secondPillarWithdrawal = getWithdrawalDetails('SECOND', secondPillarSourceFunds);
  const thirdPillarWithdrawal = getWithdrawalDetails('THIRD', thirdPillarSourceFunds);

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
  withdrawalAmount,
  eligibility,
  funds,
  secondPillarSourceFunds,
  thirdPillarSourceFunds,
}: {
  personalDetails: PersonalDetailsStepState;
  pensionHoldings: PensionHoldings;
  withdrawalAmount: WithdrawalsAmountStepState;
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
    ...getFundPensionMandatesToCreate(
      personalDetails,
      withdrawalAmount,
      eligibility,
      pensionHoldings,
    ),
    ...getPartialWithdrawalMandatesToCreate(
      personalDetails,
      withdrawalAmount,
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
      .map(({ activeFund, name, isin }) => ({ activeFund, name, isin }));
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(missingFunds));
    captureException(new Error(`Some withdrawal NAVs are missing ${JSON.stringify(missingFunds)}`));
  }

  return allNavsPresent;
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
