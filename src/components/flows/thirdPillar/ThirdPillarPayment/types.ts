export type AvailablePaymentType = 'SINGLE' | 'RECURRING';

export const bankKeyToBankNameMap = {
  swedbank: 'Swedbank',
  seb: 'SEB',
  lhv: 'LHV',
  luminor: 'Luminor',
  coop: 'Coop Pank',
} as const;

export type BankKey = keyof typeof bankKeyToBankNameMap;
