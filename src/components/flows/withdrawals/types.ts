import { TranslationKey } from '../../translations';

export type WithdrawalsContextState = {
  currentStep: WithdrawalStep | null;
  withdrawalAmount: WithdrawalsAmountStepState;
  personalDetails: PersonalDetailsStepState;
  pensionHoldings: PensionHoldings | null;

  mandatesToCreate: WithdrawalMandateDetails[] | null;

  setWithdrawalAmount: (state: WithdrawalsAmountStepState) => unknown;
  setPersonalDetails: (state: PersonalDetailsStepState) => unknown;

  navigateToNextStep: () => void;
  navigateToPreviousStep: () => void;
};

export type PensionHoldings = {
  totalSecondPillar: number;
  totalThirdPillar: number;
  totalBothPillars: number;
};

export type WithdrawalsAmountStepState = {
  pillarsToWithdrawFrom: PillarToWithdrawFrom;
  singleWithdrawalAmount: number | null;
};

export type PersonalDetailsStepState = {
  bankAccountIban: string | null;
  taxResidencyCode: string; // TODO
};

export type WithdrawalStep = {
  type: 'WITHDRAWAL_SIZE' | 'YOUR_INFORMATION' | 'REVIEW_AND_CONFIRM';
  titleId: TranslationKey;
  component: () => JSX.Element | null;
};

export type WithdrawalStepType = WithdrawalStep['type'];

export type PillarToWithdrawFrom = 'SECOND' | 'THIRD' | 'BOTH';

export type WithdrawalMandateDetails =
  | FundPensionOpeningMandateDetails
  | PartialWithdrawalMandateDetails;

export type FundPensionOpeningMandateDetails = {
  type: 'FUND_PENSION_OPENING';
  pillar: 'SECOND' | 'THIRD';
  // TODO remove from backend frequency: 'MONTHLY' |
  duration: {
    durationYears: number;
    recommendedDuration: boolean;
  };
  bankAccountDetails: BankAccountDetails;
};

export type PartialWithdrawalMandateDetails = {
  type: 'PARTIAL_WITHDRAWAL';
  pillar: 'SECOND' | 'THIRD';
  bankAccountDetails: BankAccountDetails;
  fundWithdrawalAmounts: {
    isin: string;
    percentage: number;
    units: number;
  }[];
};

export type BankAccountDetails = {
  type: 'ESTONIAN';
  // TODO remove? bank: 'COOP' | 'SEB' | 'SWED'
  accountIban: string;
};
