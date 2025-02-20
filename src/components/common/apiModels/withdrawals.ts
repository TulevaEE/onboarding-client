import { Pillar } from '.';

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
  id: number;
  mandates: MandateDto[];
};
