import { Loader } from '../../../common';
import { useCapitalTotal } from '../../../common/apiHooks';
import { formatAmountForCount, formatAmountForCurrency } from '../../../common/utils';

export const SaleOfTotalCapitalDescription = ({ saleUnitAmount }: { saleUnitAmount: number }) => {
  const { data: capitalTotal, isLoading } = useCapitalTotal();

  if (isLoading || !capitalTotal) {
    return <Loader />;
  }

  const saleUnitPercentage = Math.min((saleUnitAmount / capitalTotal.unitAmount) * 100, 100);
  const totalUnitAmountMillions = capitalTotal.unitAmount / 10e5;

  return (
    <div className="text-secondary mt-2">
      Müüd liikmekapitali raamatupidamislikus väärtuses {formatAmountForCurrency(saleUnitAmount)}.
      See on ~{formatAmountForCount(saleUnitPercentage)}% osalus kogu Tuleva ühistu liikmekapitali
      väärtusest ({formatAmountForCurrency(totalUnitAmountMillions)} mln).
    </div>
  );
};
