import { TranslationKey } from '../../translations';

export type WithdrawalStep = {
  type: 'WITHDRAWAL_SIZE' | 'YOUR_INFORMATION' | 'SIGNING';
  titleId: TranslationKey;
  component: () => JSX.Element | null;
};

export type WithdrawalStepType = WithdrawalStep['type'];

export type PillarToWithdrawFrom = 'SECOND' | 'THIRD' | 'BOTH';

export type WithdrawalMandateDetails =
  | FundPensionOpeningMandateDetails
  | PartialWithdrawalMandateDetails;

export type FundPensionOpeningMandateDetails = {
  pillar: 'SECOND' | 'THIRD';
  // TODO remove from backend frequency: 'MONTHLY' |
  duration: {
    durationYears: number;
    recommendedDuration: boolean;
  };
  bankAccountDetails: BankAccountDetails;
};

export type PartialWithdrawalMandateDetails = {
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
