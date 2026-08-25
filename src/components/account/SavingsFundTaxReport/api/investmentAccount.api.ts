import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { getEndpoint } from '../../../common/api';
import {
  deleteWithAuthentication,
  getWithAuthentication,
  putWithAuthentication,
} from '../../../common/http';
import { InvestmentAccount } from '../../../common/apiModels';

const INVESTMENT_ACCOUNT_QUERY_KEY = 'investmentAccount';

export function getInvestmentAccount(): Promise<InvestmentAccount> {
  return getWithAuthentication(getEndpoint('/v1/savings-fund/investment-account'), undefined);
}

export function useInvestmentAccount(
  options: { enabled?: boolean } = {},
): UseQueryResult<InvestmentAccount> {
  return useQuery({
    queryKey: [INVESTMENT_ACCOUNT_QUERY_KEY],
    queryFn: () => getInvestmentAccount(),
    enabled: options.enabled ?? true,
  });
}

export function useDeclareInvestmentAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (iban: string | null) =>
      iban === null
        ? deleteWithAuthentication<InvestmentAccount>(
            getEndpoint('/v1/savings-fund/investment-account'),
          )
        : putWithAuthentication<InvestmentAccount>(
            getEndpoint('/v1/savings-fund/investment-account'),
            { iban },
          ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVESTMENT_ACCOUNT_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['savingsFundTaxReport'] });
    },
  });
}

export function isRejectedAccountNumber(error: unknown): boolean {
  const body = (error as { body?: { errors?: { code?: string }[] } })?.body;
  return body?.errors?.some((one) => one.code === 'investmentAccount.iban.invalid') ?? false;
}
