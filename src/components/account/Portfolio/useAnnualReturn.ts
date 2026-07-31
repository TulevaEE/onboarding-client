import { useQuery } from '@tanstack/react-query';
import { getReturns } from '../ComparisonCalculator/api/returnComparison.api';
import { Return } from '../ComparisonCalculator/api/returnComparison.types';

/**
 * The backend computes an annualised money-weighted return (XIRR) for the pension
 * pillars. Rates from different sources cannot be added together, so a single rate is
 * only meaningful when exactly one source is being shown.
 */
export const useAnnualReturn = (
  keys: string[],
  from: string,
  to: string,
): { personalReturn: Return | null } => {
  const { data } = useQuery({
    queryKey: ['savingsFundStatementReturns', keys.join(), from, to],
    queryFn: () => getReturns(keys, from, to),
    enabled: keys.length === 1,
  });

  const personalReturn =
    data?.returns?.find((item) => item.type === 'PERSONAL' && keys.includes(item.key)) ?? null;

  return { personalReturn };
};
