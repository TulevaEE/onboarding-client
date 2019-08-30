import { get } from '../../../common/http';
import { getEndpoint } from '../../../common/api';

export enum Key {
  SECOND_PILLAR = 'SECOND_PILLAR',
  THIRD_PILLAR = 'THIRD_PILLAR',
  EPI = 'EPI',
  MARKET = 'MARKET',
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
  { personalKey }: { personalKey: Key },
  token: string,
): Promise<ReturnComparison> {
  const { returns } = await getReturns(date, [personalKey, Key.EPI, Key.MARKET], token);

  const personal = getReturnByKey(personalKey, returns);
  const pensionFund = getReturnByKey(Key.EPI, returns);
  const index = getReturnByKey(Key.MARKET, returns);

  return { personal, pensionFund, index };
}

function getReturnByKey(key: string, returns: Return[]): NullableNumber {
  const returnForKey = returns.find(ret => ret.key === key);

  return returnForKey ? returnForKey.value : null;
}

function getReturns(startDate: string, keys: Key[], token: string): Promise<ReturnsResponse> {
  const params = { from: startDate, keys };
  const headers = { Authorization: `Bearer ${token}` };

  return get(getEndpoint('/v1/returns'), params, headers);
}
