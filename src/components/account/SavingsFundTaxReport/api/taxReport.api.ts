import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getEndpoint } from '../../../common/api';
import { getWithAuthentication } from '../../../common/http';
import { CostBasisMethod, SavingsFundTaxReport } from '../../../common/apiModels';
import { mockRequestInMockMode } from '../../../common/requestMocker';

export function getSavingsFundTaxReport(
  year: number,
  method: CostBasisMethod,
): Promise<SavingsFundTaxReport> {
  return mockRequestInMockMode(
    () => getWithAuthentication(getEndpoint('/v1/savings-fund/tax-report'), { year, method }),
    'savingsFundTaxReport',
  );
}

export function useSavingsFundTaxReport(
  year: number,
  method: CostBasisMethod,
): UseQueryResult<SavingsFundTaxReport> {
  return useQuery({
    queryKey: ['savingsFundTaxReport', year, method],
    queryFn: () => getSavingsFundTaxReport(year, method),
  });
}
