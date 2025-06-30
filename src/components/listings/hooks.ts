import { useCapitalRows } from '../common/apiHooks';

export const useMemberCapitalHoldings = () => {
  const { data: capitalRows, isLoading } = useCapitalRows();

  if (isLoading) {
    return null;
  }

  return (
    capitalRows
      ?.filter((row) => row.type !== 'UNVESTED_WORK_COMPENSATION')
      .reduce((acc, row) => acc + row.value, 0) ?? null
  );
};
