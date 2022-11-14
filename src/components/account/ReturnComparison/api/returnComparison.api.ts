import { get } from '../../../common/http';
import { getEndpoint } from '../../../common/api';

// eslint-disable-next-line no-shadow
export enum Key {
  SECOND_PILLAR = 'SECOND_PILLAR',
  THIRD_PILLAR = 'THIRD_PILLAR',
  EPI = 'EPI',
  UNION_STOCK_INDEX = 'UNION_STOCK_INDEX',
  CPI = 'CPI',
}

type ReturnType = 'PERSONAL' | 'FUND' | 'INDEX';

interface Return {
  type: ReturnType;
  key: string;
  rate: number;
  amount: number;
  currency: string;
}

interface ReturnsResponse {
  from: string;
  notEnoughHistory: boolean;
  returns: Return[];
}

export interface ReturnRateAndAmount {
  rate: number;
  amount: number;
}

interface ReturnComparison {
  personal: ReturnRateAndAmount | null;
  pensionFund: ReturnRateAndAmount | null;
  index: ReturnRateAndAmount | null;
  notEnoughHistory: boolean;
}

export async function getReturnComparison(
  date: string,
  {
    personalKey,
    pensionFundKey,
    indexKey,
  }: { personalKey: Key; pensionFundKey: Key | string; indexKey: Key },
  token: string,
): Promise<ReturnComparison> {
  const { notEnoughHistory, returns } = await getReturns(
    date,
    [personalKey, pensionFundKey, indexKey],
    token,
  );

  const personal = getReturnByKey(personalKey, returns);
  const pensionFund = getReturnByKey(pensionFundKey, returns);
  const index = getReturnByKey(indexKey, returns);

  return { personal, pensionFund, index, notEnoughHistory };
}

function getReturnByKey(key: string, returns: Return[]): ReturnRateAndAmount | null {
  const returnForKey = returns?.find((ret) => ret.key === key);

  return returnForKey ? { rate: returnForKey.rate, amount: returnForKey.amount } : null;
}

function getReturns(
  startDate: string,
  keys: (Key | string)[],
  token: string,
): Promise<ReturnsResponse> {
  const params = { from: startDate, keys };
  const headers = { Authorization: `Bearer ${token}` };

  return get(getEndpoint('/v1/returns'), params, headers);
}
