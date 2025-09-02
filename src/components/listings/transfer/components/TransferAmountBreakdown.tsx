import { Fragment } from 'react';
import { CapitalType } from '../../../common/apiModels';
import { CapitalTransferAmount } from '../../../common/apiModels/capital-transfer';
import { formatAmountForCurrency } from '../../../common/utils';
import { sortTransferAmounts } from '../create/utils';

export const TransferAmountBreakdown = ({
  totalBookValue,
  amounts,
}: {
  totalBookValue: number;
  amounts: CapitalTransferAmount[];
}) => {
  const sortedAmounts = sortTransferAmounts(amounts).filter((amount) => amount.bookValue !== 0);

  if (sortedAmounts.length === 1) {
    return (
      <>
        <div className="row mt-4 py-2">
          <div className="col">
            <b>Müüdav liikmekapital</b>
          </div>

          <div className="col">
            <div>
              <b>{formatAmountForCurrency(totalBookValue)}</b>
            </div>
          </div>
        </div>

        {sortedAmounts.map((amount) => (
          <div className="row" key={amount.type}>
            <div className="col">
              (<TransferAmountName type={amount.type} />)
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      <div className="row mt-4 py-2">
        <div className="col">
          <b>Müüdav liikmekapital</b>
        </div>

        <div className="col">
          <div>
            <b>{formatAmountForCurrency(totalBookValue)}</b>
          </div>
        </div>
      </div>

      {sortedAmounts.map((amount) => (
        <div className="row" key={amount.type}>
          <div className="col">
            – <TransferAmountName type={amount.type} />
          </div>
          <div className="col">{formatAmountForCurrency(amount.bookValue)}</div>
        </div>
      ))}
    </>
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
