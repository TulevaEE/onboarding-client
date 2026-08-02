import { getWithAuthentication } from '../../../common/http';
import { getEndpoint } from '../../../common/api';
import { mockRequestInMockMode } from '../../../common/requestMocker';
import {
  ComparableReturn,
  Key,
  Return,
  ReturnComparison,
  ReturnsResponse,
} from './returnComparison.types';

export { Key } from './returnComparison.types';
export type {
  ComparableReturn,
  Return,
  ReturnComparison,
  ReturnsResponse,
} from './returnComparison.types';

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

// A return the server could not compute a rate for cannot be compared against, so it
// is reported as absent rather than as a zero-rate return.
function getReturnByKey(key: string, returns: Return[]): ComparableReturn | null {
  const found = returns?.find((ret) => ret.key === key);
  return found && found.rate !== null ? { ...found, rate: found.rate } : null;
}

export function getReturns(
  keys: (Key | string)[],
  fromDate: string,
  toDate?: string,
): Promise<ReturnsResponse> {
  const params = { keys, from: fromDate, to: toDate };

  return mockRequestInMockMode(
    () => getWithAuthentication(getEndpoint('/v1/returns'), params),
    'returns',
  );
}
