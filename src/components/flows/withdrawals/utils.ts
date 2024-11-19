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
      fund.price / fundIsinToFundNavMap[fund.isin]; // TODO handle null NAV better

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

  const allFunds = [...secondPillarSourceFunds, ...thirdPillarSourceFunds];
  const areNavsMissing = allFunds.every(
    (fund) =>
      Object.prototype.hasOwnProperty.call(fundIsinToFundNavMap, fund.isin) &&
      typeof fundIsinToFundNavMap[fund.isin] === 'number',
  );

  if (areNavsMissing) {
    const missingNavs: { name: string; isin: string }[] = allFunds
      .filter(
        (fund) =>
          !(
            Object.prototype.hasOwnProperty.call(fundIsinToFundNavMap, fund.isin) &&
            typeof fundIsinToFundNavMap[fund.isin] === 'number'
          ),
      )
      .map(({ name, isin }) => ({ name, isin }));

    captureException(new Error(`Some withdrawal NAVs are missing ${Object.entries(missingNavs)}`));
  }

  return areNavsMissing;
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
