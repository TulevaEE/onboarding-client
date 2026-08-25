import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { getEndpoint } from '../../../common/api';
import { getWithAuthentication, putWithAuthentication } from '../../../common/http';
import { InvestmentAccount } from '../../../common/apiModels';

const INVESTMENT_ACCOUNT_QUERY_KEY = 'investmentAccount';

export function getInvestmentAccount(): Promise<InvestmentAccount> {
  return getWithAuthentication(getEndpoint('/v1/savings-fund/investment-account'), undefined);
}

export function useInvestmentAccount(): UseQueryResult<InvestmentAccount> {
  return useQuery({
    queryKey: [INVESTMENT_ACCOUNT_QUERY_KEY],
    queryFn: () => getInvestmentAccount(),
  });
}

export function useDeclareInvestmentAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (iban: string) =>
      putWithAuthentication<InvestmentAccount>(getEndpoint('/v1/savings-fund/investment-account'), {
        iban,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVESTMENT_ACCOUNT_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['savingsFundTaxReport'] });
    },
  });
}
