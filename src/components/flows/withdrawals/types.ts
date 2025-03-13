import { WithdrawalMandateDetails } from '../../common/apiModels/withdrawals';
import { TranslationKey } from '../../translations';

export type WithdrawalsContextState = {
  currentStep: WithdrawalStep | null;
  amountStep: WithdrawalsAmountStepState;
  personalDetails: PersonalDetailsStepState;
  pensionHoldings: PensionHoldings | null;

  mandatesToCreate: WithdrawalMandateDetails[] | null;

  allFundNavsPresent: boolean;

  mandatesSubmitted: boolean;
  onMandatesSubmitted: () => unknown;
  setAmountStep: (state: Partial<WithdrawalsAmountStepState>) => unknown;
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
  fundPensionEnabled: boolean;
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
