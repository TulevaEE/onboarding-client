import { SourceFund } from '../../common/apiModels/index';
import { getValueSum } from '../../account/AccountStatement/fundSelector';
import {
  PensionHoldings,
  PersonalDetailsStepState,
  WithdrawalsAmountStepState,
  BankAccountDetails,
  FundPensionOpeningMandateDetails,
  PartialWithdrawalMandateDetails,
  WithdrawalMandateDetails,
} from './types';
import { WithdrawalsEligibility } from '../../common/apiModels/withdrawals';

export const getBankAccountDetails = (
  personalDetails: PersonalDetailsStepState,
): BankAccountDetails => ({
  type: 'ESTONIAN',
  accountIban: personalDetails.bankAccountIban as string,
});

export const getPartialWithdrawalMandatesToCreate = (
  personalDetails: PersonalDetailsStepState,
  withdrawalAmount: WithdrawalsAmountStepState,
  pensionHoldings: PensionHoldings,
  secondPillarSourceFunds: SourceFund[],
  thirdPillarSourceFunds: SourceFund[],
): PartialWithdrawalMandateDetails[] => {
  if (withdrawalAmount.singleWithdrawalAmount === null) {
    return [];
  }

  const bankAccountDetails = getBankAccountDetails(personalDetails);

  const partialWithdrawalOfTotal =
    withdrawalAmount.singleWithdrawalAmount / pensionHoldings.totalBothPillars;

  const secondPillarWithdrawal: PartialWithdrawalMandateDetails = {
    type: 'PARTIAL_WITHDRAWAL',
    pillar: 'SECOND',
    bankAccountDetails,
    fundWithdrawalAmounts: secondPillarSourceFunds.map((fund) => ({
      isin: fund.isin,
      percentage: Math.floor(partialWithdrawalOfTotal * 100),
      units: 0, // TODO
    })),
  };

  const thirdPillarWithdrawal: PartialWithdrawalMandateDetails = {
    type: 'PARTIAL_WITHDRAWAL',
    pillar: 'THIRD',
    bankAccountDetails,
    fundWithdrawalAmounts: thirdPillarSourceFunds.map((fund) => ({
      isin: fund.isin,
      percentage: Math.floor(partialWithdrawalOfTotal * 100),
      units: 0, // TODO
    })),
  };

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
  if (pensionHoldings.totalBothPillars === withdrawalAmount.singleWithdrawalAmount) {
    return [];
  }

  const bankAccountDetails = getBankAccountDetails(personalDetails);

  const secondPillarWithdrawal: FundPensionOpeningMandateDetails = {
    type: 'FUND_PENSION_OPENING',
    pillar: 'SECOND',
    bankAccountDetails,
    duration: {
      durationYears: withdrawalsEligibility.recommendedDurationYears,
      recommendedDuration: true,
    },
  };

  const thirdPillarWithdrawal: FundPensionOpeningMandateDetails = {
    type: 'FUND_PENSION_OPENING',
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
  secondPillarSourceFunds,
  thirdPillarSourceFunds,
}: {
  personalDetails: PersonalDetailsStepState;
  pensionHoldings: PensionHoldings;
  withdrawalAmount: WithdrawalsAmountStepState;
  eligibility: WithdrawalsEligibility | null;
  secondPillarSourceFunds: SourceFund[] | null;
  thirdPillarSourceFunds: SourceFund[] | null;
}): WithdrawalMandateDetails[] | null => {
  if (
    !eligibility ||
    !pensionHoldings ||
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
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
    ),
  ];
};

export const getEstimatedFundPension = ({
  totalAmount,
  durationYears,
  singleWithdrawalAmountFromPillar,
}: {
  totalAmount: number;
  durationYears: number;
  singleWithdrawalAmountFromPillar: number | null;
}) => {
  const fundPensionSize = totalAmount - (singleWithdrawalAmountFromPillar ?? 0);
  const fundPensionPeriods = durationYears * 12;

  const fundPensionMonthlyPaymentApproximateSize = fundPensionSize / fundPensionPeriods;
  const fundPensionPercentageLiquidatedMonthly = 1 / fundPensionPeriods;

  return { fundPensionMonthlyPaymentApproximateSize, fundPensionPercentageLiquidatedMonthly };
};
