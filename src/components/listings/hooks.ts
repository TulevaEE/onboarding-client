import { useCapitalRows } from '../common/apiHooks';

export const useMemberCapitalSum = () => {
  const { data: capitalRows, isLoading } = useCapitalRows();

  if (isLoading) {
    return { unitAmount: null, bookValue: null };
  }

  const filteredRows = capitalRows?.filter((row) => row.type !== 'UNVESTED_WORK_COMPENSATION');

  return {
    unitAmount: filteredRows?.reduce((acc, row) => acc + row.unitCount, 0) ?? null,
    bookValue: filteredRows?.reduce((acc, row) => acc + row.value, 0) ?? null,
  };
};
