import { TranslationKey } from '../../translations';

export type WithdrawalStep = {
  type: 'WITHDRAWAL_SIZE' | 'YOUR_INFORMATION' | 'SIGNING';
  titleId: TranslationKey;
  component: () => JSX.Element | null;
};

export type WithdrawalStepType = WithdrawalStep['type'];

export type PillarToWithdrawFrom = 'SECOND' | 'THIRD' | 'BOTH';
