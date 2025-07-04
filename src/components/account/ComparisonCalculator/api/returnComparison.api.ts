import { getWithAuthentication } from '../../../common/http';
import { getEndpoint } from '../../../common/api';

export enum Key {
  SECOND_PILLAR = 'SECOND_PILLAR',
  THIRD_PILLAR = 'THIRD_PILLAR',
  EPI = 'EPI',
  EPI_3 = 'EPI_3',
  UNION_STOCK_INDEX = 'UNION_STOCK_INDEX',
  CPI = 'CPI',
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

export async function getReturnComparison(
  {
    personalKey,
    pensionFundKey,
    indexKey,
  }: { personalKey: Key; pensionFundKey: Key | string; indexKey: Key },
  fromDate: string,
  toDate?: string,
): Promise<ReturnComparison> {
  const { returns, from, to } = await getReturns(
    [personalKey, pensionFundKey, indexKey],
    fromDate,
    toDate,
  );

  const personal = getReturnByKey(personalKey, returns);
  const pensionFund = getReturnByKey(pensionFundKey, returns);
  const index = getReturnByKey(indexKey, returns);

  return { personal, pensionFund, index, from, to };
}

function getReturnByKey(key: string, returns: Return[]): Return | null {
  return returns?.find((ret) => ret.key === key) || null;
}

export function getReturns(
  keys: (Key | string)[],
  fromDate: string,
  toDate?: string,
): Promise<ReturnsResponse> {
  const params = { keys, from: fromDate, to: toDate };

  return getWithAuthentication(getEndpoint('/v1/returns'), params);
}
