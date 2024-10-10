import { TranslationKey } from '../../translations';
import { WithdrawalAmountStep } from './WithdrawalAmountStep';

export type WithdrawalStep = {
  type: 'WITHDRAWAL_SIZE' | 'YOUR_INFORMATION' | 'SIGNING';
  titleId: TranslationKey;
  component: () => JSX.Element;
};

export type WithdrawalStepType = WithdrawalStep['type'];

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
