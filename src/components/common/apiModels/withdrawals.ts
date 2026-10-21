export type FundPensionStatus = {
  fundPensions: FundPension[];
};

export type FundPension = {
  pillar: 'SECOND' | 'THIRD';
  active: boolean;
  startDate: string;
  endDate: string | null;
  durationYears: number;
};

export type WithdrawalsEligibility = {
  hasReachedEarlyRetirementAge: boolean;
  canWithdrawThirdPillarWithReducedTax: boolean;
  canWithdrawThirdPillarWithReducedTaxFrom: string | null;
  earlyRetirementDate: string;
  recommendedDurationYears: number;
  age: number;
  arrestsOrBankruptciesPresent: boolean;
};

export type WithdrawalMandateDetails =
  | FundPensionOpeningMandateDetails
  | PartialWithdrawalMandateDetails;

export type FundPensionOpeningMandateDetails = {
  mandateType: 'FUND_PENSION_OPENING';
  pillar: 'SECOND' | 'THIRD';
  duration: {
    durationYears: number;
    recommendedDuration: boolean;
  };
  bankAccountDetails: BankAccountDetails;
};

export type PartialWithdrawalMandateDetails = {
  mandateType: 'PARTIAL_WITHDRAWAL';
  pillar: 'SECOND' | 'THIRD';
  bankAccountDetails: BankAccountDetails;
  fundWithdrawalAmounts: {
    isin: string;
    percentage: number;
    units: number;
  }[];
  taxResidency: string;
};

export type BankAccountDetails = {
  type: 'ESTONIAN';
  accountIban: string;
};

export type RejoinMandateDetails = {
  mandateType: 'REJOIN';
};

export type PaymentRateChangeMandateDetails = {
  mandateType: 'PAYMENT_RATE_CHANGE';
  paymentRate: 'TWO' | 'FOUR' | 'SIX';
};

export type SelectionMandateDetails = {
  mandateType: 'SELECTION';
  futureContributionFundIsin: string;
};

export type RejoinBatchMandateDetails =
  | RejoinMandateDetails
  | PaymentRateChangeMandateDetails
  | SelectionMandateDetails;

export type CreateMandateDto = {
  details: WithdrawalMandateDetails | RejoinBatchMandateDetails;
};

export type MandateDto = CreateMandateDto & {
  id: number;
  createdDate: string;
};

export type CreateMandateBatchDto = {
  mandates: CreateMandateDto[];
};

export type MandateBatchDto = {
  id: number;
  mandates: MandateDto[];
};
