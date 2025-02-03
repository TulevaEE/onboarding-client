import { WithdrawalMandateDetails } from '../../common/apiModels/withdrawals';
import { TranslationKey } from '../../translations';

export type WithdrawalsContextState = {
  currentStep: WithdrawalStep | null;
  withdrawalAmount: WithdrawalsAmountStepState;
  personalDetails: PersonalDetailsStepState;
  pensionHoldings: PensionHoldings | null;
  availablePillars: Set<'SECOND' | 'THIRD'>;

  mandatesToCreate: WithdrawalMandateDetails[] | null;

  allFundNavsPresent: boolean;

  mandatesSubmitted: boolean;

  onMandatesSubmitted: () => unknown;
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
  type: 'WITHDRAWAL_SIZE' | 'YOUR_INFORMATION' | 'REVIEW_AND_CONFIRM' | 'DONE';
  titleId: TranslationKey;
  subPath: string;
  hidden?: boolean;
  component: () => JSX.Element | null;
};

export type WithdrawalStepType = WithdrawalStep['type'];

export type PillarToWithdrawFrom = 'SECOND' | 'THIRD' | 'BOTH';
