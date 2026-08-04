import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getEndpoint } from '../../../common/api';
import { getWithAuthentication } from '../../../common/http';
import { Portfolio } from '../../../common/apiModels';
import { mockRequestInMockMode } from '../../../common/requestMocker';

export function getPortfolio(from: string | undefined, to: string): Promise<Portfolio> {
  return mockRequestInMockMode(
    () => getWithAuthentication(getEndpoint('/v1/portfolio'), from ? { from, to } : { to }),
    'portfolio',
  );
}

export function usePortfolio(from: string | undefined, to: string): UseQueryResult<Portfolio> {
  return useQuery({
    queryKey: ['portfolio', from ?? 'allTime', to],
    queryFn: () => getPortfolio(from, to),
  });
}
