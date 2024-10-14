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
  secondPillarSourceFunds: SourceFund[],
  thirdPillarSourceFunds: SourceFund[],
): PartialWithdrawalMandateDetails[] => {
  if (withdrawalAmount.singleWithdrawalAmount === null) {
    return [];
  }

  const bankAccountDetails = getBankAccountDetails(personalDetails);

  const bothPillarsTotal = getValueSum([...secondPillarSourceFunds, ...thirdPillarSourceFunds]);
  const partialWithdrawalOfTotal = withdrawalAmount.singleWithdrawalAmount / bothPillarsTotal;

  const secondPillarTotal = getValueSum(secondPillarSourceFunds);
  const secondPillarRatio = secondPillarTotal / bothPillarsTotal;

  const thirdPillarTotal = getValueSum(thirdPillarSourceFunds);
  const thirdPillarRatio = thirdPillarTotal / bothPillarsTotal;

  const secondPillarWithdrawal: PartialWithdrawalMandateDetails = {
    type: 'PARTIAL_WITHDRAWAL',
    pillar: 'SECOND',
    bankAccountDetails,
    fundWithdrawalAmounts: secondPillarSourceFunds.map((fund) => ({
      isin: fund.isin,
      percentage: Math.floor(partialWithdrawalOfTotal * secondPillarRatio),
      units: 0, // TODO
    })),
  };

  const thirdPillarWithdrawal: PartialWithdrawalMandateDetails = {
    type: 'PARTIAL_WITHDRAWAL',
    pillar: 'THIRD',
    bankAccountDetails,
    fundWithdrawalAmounts: secondPillarSourceFunds.map((fund) => ({
      isin: fund.isin,
      percentage: Math.floor(partialWithdrawalOfTotal * thirdPillarRatio),
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
    console.log(eligibility, pensionHoldings, secondPillarSourceFunds, thirdPillarSourceFunds);

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
      secondPillarSourceFunds,
      thirdPillarSourceFunds,
    ),
  ];
};
