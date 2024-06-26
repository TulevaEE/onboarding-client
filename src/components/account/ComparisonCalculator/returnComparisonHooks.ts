import { useQuery, UseQueryResult } from 'react-query';
import { getReturnComparison, Key, ReturnComparison } from './api';

const START_DATE = '2003-01-07';

export function useDefaultReturns(): UseQueryResult<ReturnComparison> {
  return useReturns(START_DATE, {
    personalKey: Key.SECOND_PILLAR,
    pensionFundKey: Key.EPI,
    indexKey: Key.UNION_STOCK_INDEX,
  });
}
export function useReturns(
  date: string,
  {
    personalKey,
    pensionFundKey,
    indexKey,
  }: { personalKey: Key; pensionFundKey: Key | string; indexKey: Key },
): UseQueryResult<ReturnComparison> {
  return useQuery('returns', () =>
    getReturnComparison(date, { personalKey, pensionFundKey, indexKey }),
  );
}
