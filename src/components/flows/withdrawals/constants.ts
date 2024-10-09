import { WithdrawalAmountStep } from './WithdrawalAmountStep';

export type WithdrawalStep = {
  type: 'WITHDRAWAL_SIZE' | 'YOUR_INFORMATION' | 'SIGNING';
  component: () => JSX.Element;
};

export type WithdrawalStepType = WithdrawalStep['type'];

export const withdrawalSteps: WithdrawalStep[] = [
  { type: 'WITHDRAWAL_SIZE', component: WithdrawalAmountStep },
  { type: 'YOUR_INFORMATION', component: WithdrawalAmountStep },
  { type: 'SIGNING', component: WithdrawalAmountStep },
];
