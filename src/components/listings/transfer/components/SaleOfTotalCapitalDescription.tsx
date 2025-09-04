import { Loader } from '../../../common';
import { useCapitalTotal } from '../../../common/apiHooks';
import { formatAmountForCount, formatAmountForCurrency } from '../../../common/utils';

export type ListingTypeProps =
  | {
      type: 'LISTING';
      transactionType: 'BUY' | 'SELL';
    }
  | {
      type: 'TRANSFER';
      transactionType: 'SELL';
    };

export const SaleOfTotalCapitalDescription = ({
  saleBookValueAmount,
  type,
  transactionType,
}: {
  saleBookValueAmount: number;
} & ListingTypeProps) => {
  const { data: capitalTotal, isLoading } = useCapitalTotal();

  if (isLoading || !capitalTotal) {
    return <Loader />;
  }

  const saleUnitPercentage = Math.min((saleBookValueAmount / capitalTotal.unitAmount) * 100, 100);
  const totalUnitAmountMillions = capitalTotal.unitAmount / 10e5;

  if (type === 'TRANSFER') {
    return (
      <p className="m-0 text-secondary">
        Oled ostjaga kokku leppinud liikmekapitali müümises, mille raamatupidamislik väärtus on{' '}
        {formatAmountForCurrency(saleBookValueAmount)}. See on{' '}
        {saleBookValueAmount !== 0 ? '~' : ''}
        {formatAmountForCount(saleUnitPercentage)}% osalus kogu Tuleva ühistu liikmekapitali
        raamatupidamislikust väärtusest ({formatAmountForCurrency(totalUnitAmountMillions)} mln).
      </p>
    );
  }

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
