import { FormattedMessage } from 'react-intl';
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

  const saleUnitPercentage = Math.min((saleBookValueAmount / capitalTotal.totalValue) * 100, 100);
  const totalBookValueMillions = capitalTotal.totalValue / 10e5;

  if (type === 'TRANSFER') {
    return (
      <p className="m-0 text-secondary">
        <FormattedMessage
          id="capital.transfer.saleOfTotalCapitalDescription.TRANSFER.SELL"
          values={{
            saleAmount: formatAmountForCurrency(saleBookValueAmount),
            percentOfTotal: `${
              (saleBookValueAmount !== 0 ? '~' : '') + formatAmountForCount(saleUnitPercentage)
            }%`,
            totalBookValueMillions,
          }}
        />
      </p>
    );
  }

  // have to repeat this for TS
  return (
    <p className="m-0 text-secondary">
      <FormattedMessage
        id={`capital.transfer.saleOfTotalCapitalDescription.LISTING.${transactionType}`}
        values={{
          saleAmount: formatAmountForCurrency(saleBookValueAmount),
          percentOfTotal: `${
            (saleBookValueAmount !== 0 ? '~' : '') + formatAmountForCount(saleUnitPercentage)
          }%`,
          totalBookValueMillions,
        }}
      />
    </p>
  );
};
