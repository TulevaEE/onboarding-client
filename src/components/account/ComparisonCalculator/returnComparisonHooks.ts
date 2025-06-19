import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getReturnComparison, getReturns, Key, ReturnComparison, ReturnsResponse } from './api';

const START_DATE = '2003-01-07';

export function useDefaultReturns(): UseQueryResult<ReturnComparison> {
  return useQuery(['returns'], () =>
    getReturnComparison(
      {
        personalKey: Key.SECOND_PILLAR,
        pensionFundKey: Key.EPI,
        indexKey: Key.UNION_STOCK_INDEX,
      },
      START_DATE,
    ),
  );
}

export function useReturns(
  keys: (Key | string)[],
  fromDate: string,
  toDate?: string,
): UseQueryResult<ReturnsResponse> {
  return useQuery(['returns'], () => getReturns(keys, fromDate, toDate));
}
