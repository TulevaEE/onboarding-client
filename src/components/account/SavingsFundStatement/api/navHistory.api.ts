import { useQuery, UseQueryResult } from '@tanstack/react-query';
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
