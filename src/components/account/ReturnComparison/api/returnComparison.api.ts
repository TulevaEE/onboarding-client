import { getWithAuthentication } from '../../../common/http';
import { getEndpoint } from '../../../common/api';
import { UpdatableAuthenticationPrincipal } from '../../../common/updatableAuthenticationPrincipal';

export enum Key {
  SECOND_PILLAR = 'SECOND_PILLAR',
  THIRD_PILLAR = 'THIRD_PILLAR',
  EPI = 'EPI',
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
  from: string;
  returns: Return[];
}

export interface ReturnComparison {
  personal: Return | null;
  pensionFund: Return | null;
  index: Return | null;
  from: string;
}

export async function getReturnComparison(
  date: string,
  {
    personalKey,
    pensionFundKey,
    indexKey,
  }: { personalKey: Key; pensionFundKey: Key | string; indexKey: Key },
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<ReturnComparison> {
  const { returns, from } = await getReturns(
    date,
    [personalKey, pensionFundKey, indexKey],
    authenticationPrincipal,
  );

  const personal = getReturnByKey(personalKey, returns);
  const pensionFund = getReturnByKey(pensionFundKey, returns);
  const index = getReturnByKey(indexKey, returns);

  return { personal, pensionFund, index, from };
}

function getReturnByKey(key: string, returns: Return[]): Return | null {
  return returns?.find((ret) => ret.key === key) || null;
}

function getReturns(
  startDate: string,
  keys: (Key | string)[],
  authenticationPrincipal: UpdatableAuthenticationPrincipal,
): Promise<ReturnsResponse> {
  const params = { from: startDate, keys };

  return getWithAuthentication(authenticationPrincipal, getEndpoint('/v1/returns'), params);
}
