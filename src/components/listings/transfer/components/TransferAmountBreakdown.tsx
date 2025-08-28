import { Fragment } from 'react';
import { CapitalType } from '../../../common/apiModels';
import { CapitalTransferAmount } from '../../../common/apiModels/capital-transfer';
import { formatAmountForCurrency } from '../../../common/utils';

export const TransferAmountBreakdown = ({
  totalBookValue,
  amounts,
}: {
  totalBookValue: number;
  amounts: CapitalTransferAmount[];
}) => {
  const sortedAmounts = sortAmounts(amounts);

  return (
    <div className="row mt-4 py-2">
      <div className="col">
        <div>
          <b>Müüdav liikmekapital</b>
        </div>
        {sortedAmounts.map((amount) => (
          <div>
            – <TransferAmountName key={amount.type} type={amount.type} />
          </div>
        ))}
      </div>

      <div className="col">
        <div>{formatAmountForCurrency(totalBookValue)}</div>
        {sortedAmounts.map((amount) => (
          <Fragment key={amount.type}>{formatAmountForCurrency(amount.bookValue)}</Fragment>
        ))}
      </div>
    </div>
  );
};

const TransferAmountName = ({ type }: { type: CapitalType }) => {
  if (type === 'CAPITAL_PAYMENT') {
    return <>rahaline panus</>;
  }

  if (type === 'MEMBERSHIP_BONUS') {
    return <>liikmeboonus</>;
  }

  if (type === 'WORK_COMPENSATION') {
    return <>tööpanus</>;
  }

  return null;
};

const typeOrder = ['CAPITAL_PAYMENT', 'MEMBERSHIP_BONUS', 'WORK_COMPENSATION'];
const sortAmounts = (amounts: CapitalTransferAmount[]) =>
  amounts.sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));
