import { DoneStep } from './DoneStep';
import { PersonalDetailsStep } from './PersonalDetailsStep';
import { ReviewAndConfirmStep } from './ReviewAndConfirmStep';
import { WithdrawalStep } from './types';
import { WithdrawalAmountStep } from './WithdrawalAmountStep';

export const WITHDRAWAL_STEPS: WithdrawalStep[] = [
  {
    type: 'WITHDRAWAL_SIZE',
    subPath: 'amount',
    titleId: 'withdrawals.steps.withdrawalSize',
    component: WithdrawalAmountStep,
  },
  {
    type: 'YOUR_INFORMATION',
    subPath: 'information',
    titleId: 'withdrawals.steps.yourInformation',
    component: PersonalDetailsStep,
  },
  {
    type: 'REVIEW_AND_CONFIRM',
    subPath: 'confirm',
    titleId: 'withdrawals.steps.confirmApplication',
    component: ReviewAndConfirmStep,
  },
  {
    type: 'DONE',
    subPath: 'done',
    titleId: 'withdrawals.steps.applicationSubmitted',
    component: DoneStep,
    hidden: true,
  },
];
