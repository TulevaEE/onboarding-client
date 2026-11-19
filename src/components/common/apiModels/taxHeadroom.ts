export type ExpectedIncomeBasis = 'RECENT_MONTHS' | 'LAST_YEAR' | 'NO_DATA';

export type ExpectedIncomeSource = 'ESTIMATED' | 'CORRECTED';

export type ExpectedMonthlyIncome = {
  month: string;
  amount: number;
  source: ExpectedIncomeSource;
};

export type LimitCertainty = 'CERTAIN' | 'ESTIMATED';

export type PaymentSuggestion = 'RECURRING' | 'SINGLE';

export type ThirdPillarTaxHeadroom = {
  year: number;
  knownIncome: number;
  incomeKnownThrough: string | null;
  expectedIncome: ExpectedMonthlyIncome[];
  expectedIncomeBasis: ExpectedIncomeBasis;
  paid: number;
  monthsLeft: number;
  limit: number;
  limitCertainty: LimitCertainty;
  remaining: number;
  refund: number;
  monthlyPayment: number;
  paymentSuggestion: PaymentSuggestion;
};

export type TaxDataConsentStatus = 'AWAITING_SIGNATURE' | 'SIGNED' | 'APPROVED' | 'INVALID';

export type TaxDataConsent = {
  id: number;
  status: TaxDataConsentStatus;
};
