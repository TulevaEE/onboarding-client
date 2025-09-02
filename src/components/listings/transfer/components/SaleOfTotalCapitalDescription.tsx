import { Loader } from '../../../common';
import { useCapitalTotal } from '../../../common/apiHooks';
import { formatAmountForCount, formatAmountForCurrency } from '../../../common/utils';

export const SaleOfTotalCapitalDescription = ({
  saleBookValueAmount,
  transactionType,
}: {
  saleBookValueAmount: number;
  transactionType: 'BUY' | 'SELL';
}) => {
  const { data: capitalTotal, isLoading } = useCapitalTotal();

  if (isLoading || !capitalTotal) {
    return <Loader />;
  }

  const saleUnitPercentage = Math.min((saleBookValueAmount / capitalTotal.unitAmount) * 100, 100);
  const totalUnitAmountMillions = capitalTotal.unitAmount / 10e5;

  if (transactionType === 'SELL') {
    return (
      <p className="m-0 text-secondary">
        Müüd liikmekapitali raamatupidamislikus väärtuses{' '}
        {formatAmountForCurrency(saleBookValueAmount)}. See on{' '}
        {saleBookValueAmount !== 0 ? '~' : ''}
        {formatAmountForCount(saleUnitPercentage)}% osalus kogu Tuleva ühistu liikmekapitali
        raamatupidamislikust väärtusest ({formatAmountForCurrency(totalUnitAmountMillions)} mln).
      </p>
    );
  }

  return (
    <p className="m-0 text-secondary ">
      Ostad liikmekapitali raamatupidamislikus väärtuses{' '}
      {formatAmountForCurrency(saleBookValueAmount)}. See on {saleBookValueAmount !== 0 ? '~' : ''}
      {formatAmountForCount(saleUnitPercentage)}% osalus kogu Tuleva ühistu liikmekapitali
      raamatupidamislikust väärtusest ({formatAmountForCurrency(totalUnitAmountMillions)} mln).
    </p>
  );
};
