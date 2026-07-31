import { useQueries, useQuery, UseQueryResult } from '@tanstack/react-query';
import { getEndpoint } from '../../../common/api';
import { getWithAuthentication } from '../../../common/http';
import { NavValue } from '../../../common/apiModels';
import { mockRequestInMockMode } from '../../../common/requestMocker';

export function getFundNavHistory(
  isin: string,
  startDate: string,
  endDate: string,
): Promise<NavValue[]> {
  return mockRequestInMockMode(
    () => getWithAuthentication(getEndpoint(`/v1/funds/${isin}/nav`), { startDate, endDate }),
    'navHistory',
  );
}

export function useFundNavHistory(
  isin: string | undefined,
  startDate: string,
  endDate: string,
): UseQueryResult<NavValue[]> {
  return useQuery({
    queryKey: ['fundNavHistory', isin, startDate, endDate],
    queryFn: () => getFundNavHistory(isin as string, startDate, endDate),
    enabled: !!isin,
  });
}

export interface NavHistories {
  navHistoryByIsin: Record<string, NavValue[]>;
  isLoading: boolean;
  isError: boolean;
}

export function useFundNavHistories(
  isins: string[],
  startDate: string,
  endDate: string,
): NavHistories {
  const results = useQueries({
    queries: isins.map((isin) => ({
      queryKey: ['fundNavHistory', isin, startDate, endDate],
      queryFn: () => getFundNavHistory(isin, startDate, endDate),
    })),
  });

  const navHistoryByIsin = isins.reduce<Record<string, NavValue[]>>((histories, isin, index) => {
    const history = results[index]?.data;
    return history ? { ...histories, [isin]: history } : histories;
  }, {});

  return {
    navHistoryByIsin,
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
  };
}
