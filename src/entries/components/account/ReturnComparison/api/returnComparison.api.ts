import { get } from '../../../common/http';

enum Key {
  SECOND_PILLAR = 'SECOND_PILLAR',
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

export async function getReturnComparison(date: string, token: string): Promise<ReturnComparison> {
  const { returns } = await getReturns(date, token);

  const personal = getReturnByKey(Key.SECOND_PILLAR, returns);
  const pensionFund = getReturnByKey(Key.EPI, returns);
  const index = getReturnByKey(Key.MARKET, returns);

  return {
    personal,
    pensionFund,
    index,
  };
}

function getReturnByKey(key: string, returns: Return[]): NullableNumber {
  const returnForKey = returns.find(ret => ret.key === key);

  return returnForKey ? returnForKey.value : null;
}

function getReturns(startDate: string, token: string): Promise<ReturnsResponse> {
  const params = { from: startDate };
  const headers = { Authorization: `Bearer ${token}` };

  return get('/v1/returns', params, headers);
}
