import { get } from '../../../common/http';
import { getEndpoint } from '../../../common/api';

export enum Key {
  SECOND_PILLAR = 'SECOND_PILLAR',
  THIRD_PILLAR = 'THIRD_PILLAR',
  EPI = 'EPI',
  MARKET = 'MARKET',
  CPI = 'CPI',
}

type ReturnType = 'PERSONAL' | 'FUND' | 'INDEX';

interface Return {
  type: ReturnType;
  key: string;
  value: number;
}

interface ReturnsResponse {
  from: string;
  returns: Return[];
}

type NullableNumber = number | null;

interface ReturnComparison {
  personal: NullableNumber;
  pensionFund: NullableNumber;
  index: NullableNumber;
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
  const { returns } = await getReturns(date, [personalKey, pensionFundKey, indexKey], token);

  const personal = getReturnByKey(personalKey, returns);
  const pensionFund = getReturnByKey(pensionFundKey, returns);
  const index = getReturnByKey(indexKey, returns);

  return { personal, pensionFund, index };
}

function getReturnByKey(key: string, returns: Return[]): NullableNumber {
  const returnForKey = returns.find(ret => ret.key === key);

  return returnForKey ? returnForKey.value : null;
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
