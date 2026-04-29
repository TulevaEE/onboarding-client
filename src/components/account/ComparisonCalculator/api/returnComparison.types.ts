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
  rate: number;
  amount: number;
  paymentsSum: number;
  currency: string;
}

export interface ReturnsResponse {
  returns: Return[];
  from: string;
  to: string;
}

export interface ReturnComparison {
  personal: Return | null;
  pensionFund: Return | null;
  index: Return | null;
  from: string;
  to: string;
}
