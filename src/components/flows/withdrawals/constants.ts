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
    component: WithdrawalAmountStep,
  },
  {
    type: 'SIGNING',
    titleId: 'withdrawals.content.confirmApplication',
    component: WithdrawalAmountStep,
  },
];
