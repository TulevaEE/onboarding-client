export const INSURANCE_TRANSFER_FORM_INSURERS = ['COMPENSA', 'ARTEA', 'ERGO'] as const;
export type InsuranceTransferFormInsurer = (typeof INSURANCE_TRANSFER_FORM_INSURERS)[number];

export type InsuranceTransferAddress = {
  street: string;
  city: string;
  postalCode: string;
  countryCode: string;
};

export const ID_DOCUMENT_TYPES = [
  'ID_CARD',
  'PASSPORT',
  'RESIDENCE_PERMIT',
  'TEMPORARY_PASSPORT',
  'FOREIGN_PASSPORT',
] as const;
export type IdDocumentType = (typeof ID_DOCUMENT_TYPES)[number];

export const OCCUPATION_STATUSES = [
  'EMPLOYED',
  'SELF_EMPLOYED',
  'COMPANY_OWNER',
  'STUDENT',
  'RETIRED',
  'UNEMPLOYED',
  'OTHER',
] as const;
export type OccupationStatus = (typeof OCCUPATION_STATUSES)[number];

export const INCOME_SOURCES = [
  'SALARY',
  'SELF_EMPLOYMENT',
  'DIVIDENDS',
  'INVESTMENTS',
  'LOAN',
  'INHERITANCE',
  'RENTAL',
  'REAL_ESTATE',
  'FAMILY_TRANSFERS',
  'OTHER',
] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];

export const MONTHLY_NET_INCOMES = [
  'UP_TO_600',
  'FROM_601_TO_1200',
  'FROM_1201_TO_3000',
  'FROM_3001_TO_6000',
  'OVER_6000',
] as const;
export type MonthlyNetIncome = (typeof MONTHLY_NET_INCOMES)[number];

export type ArteaQuestionnaire = {
  idDocument: {
    type: IdDocumentType;
    number: string;
    issuedOn: string;
    validUntil: string;
    issuingCountry: string;
  };
  occupation: {
    status: OccupationStatus;
    position: string | null;
    employer: string | null;
    employerAddress: string | null;
    description: string | null;
  };
  incomeSources: { source: IncomeSource; details: string | null }[];
  monthlyNetIncome: MonthlyNetIncome;
  premiumAccountIban: string;
};

export type CreateInsuranceTransferFormCommand = {
  insurer: InsuranceTransferFormInsurer;
  policyNumber: string;
  endDate: string | null;
  address: InsuranceTransferAddress;
  usPerson?: boolean;
  citizenship?: string[];
  countryOfBirth?: string;
  taxResidency?: string;
  pep?: boolean;
  artea?: ArteaQuestionnaire;
};

export type InsuranceTransferForm = {
  id: number;
  insurer: InsuranceTransferFormInsurer;
  insurerEmail: string;
  status: 'CREATED' | 'SIGNED';
  emailStatus: 'SENT' | 'FAILED' | 'NO_EMAIL' | null;
};
