import { PersonalDetailsStep } from './PersonalDetailsStep';
import { ReviewAndConfirmStep } from './ReviewAndConfirmStep';
import { WithdrawalStep } from './types';
import { WithdrawalAmountStep } from './WithdrawalAmountStep';

export const WITHDRAWAL_STEPS: WithdrawalStep[] = [
  {
    type: 'WITHDRAWAL_SIZE',
    titleId: 'withdrawals.content.payoutSize',
    component: WithdrawalAmountStep,
  },
  {
    type: 'YOUR_INFORMATION',
    titleId: 'withdrawals.content.yourInformation',
    component: PersonalDetailsStep,
  },
  {
    type: 'REVIEW_AND_CONFIRM',
    titleId: 'withdrawals.content.confirmApplication',
    component: ReviewAndConfirmStep,
  },
];
