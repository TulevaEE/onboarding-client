export type WithdrawalsEligibility = {
  hasReachedEarlyRetirementAge: boolean;
  recommendedDurationYears: number;
  age: number;
};

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

export type CreateMandateDto = {
  details: WithdrawalMandateDetails;
};

export type MandateDto = CreateMandateDto & {
  id: number;
  createdDate: string;
};

export type CreateMandateBatchDto = {
  mandates: CreateMandateDto[];
};

export type MandateBatchDto = {
  mandates: MandateDto[];
};
