import { useCapitalRows } from '../common/apiHooks';
import { getMemberCapitalSums } from './transfer/create/utils';

export const useMemberCapitalSum = () => {
  const { data: capitalRows, isLoading } = useCapitalRows();

  if (isLoading) {
    return { unitAmount: null, bookValue: null };
  }

  return getMemberCapitalSums(capitalRows ?? []);
};
