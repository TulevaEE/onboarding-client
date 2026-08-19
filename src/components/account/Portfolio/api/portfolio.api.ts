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

const isClientError = (error: unknown): boolean => {
  const status = (error as { status?: number } | null)?.status;
  return status !== undefined && status >= 400 && status < 500;
};

export function usePortfolio(from: string | undefined, to: string): UseQueryResult<Portfolio> {
  return useQuery({
    queryKey: ['portfolio', from ?? 'allTime', to],
    queryFn: () => getPortfolio(from, to),
    // The previous period stays on screen while the next one loads, so the view is not
    // unmounted on every period change — which would reset the bands someone switched off.
    keepPreviousData: true,
    retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
    refetchOnWindowFocus: false,
  });
}
