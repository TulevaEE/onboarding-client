export enum Key {
  SECOND_PILLAR = 'SECOND_PILLAR',
  THIRD_PILLAR = 'THIRD_PILLAR',
  EPI = 'EPI',
  EPI_3 = 'EPI_3',
  UNION_STOCK_INDEX = 'UNION_STOCK_INDEX',
  CPI = 'CPI_ECOICOP2',
}

type ReturnType = 'PERSONAL' | 'FUND' | 'INDEX';

export interface Return {
  type: ReturnType;
  key: string;
  rate: number | null;
  amount: number;
  paymentsSum: number;
  currency: string;
}

// A return the server was able to compute a rate for, and can therefore be compared.
export type ComparableReturn = Return & { rate: number };

export interface ReturnsResponse {
  returns: Return[];
  from: string;
  to: string;
}

export interface ReturnComparison {
  personal: ComparableReturn | null;
  pensionFund: ComparableReturn | null;
  index: ComparableReturn | null;
  from: string;
  to: string;
}
