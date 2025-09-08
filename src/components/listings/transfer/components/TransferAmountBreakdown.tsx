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
    const amount = sortedAmounts[0];
    return (
      <>
        <div className="d-flex" data-testid="capital-row-TOTAL">
          <div className="col">
            <b>Müüdav liikmekapital</b>
            <div className="lh-lg" data-testid={`capital-row-${amount.type}`}>
              (<TransferAmountName type={amount.type} />)
            </div>
          </div>

          <div className="col">
            <div>
              <b>{formatAmountForCurrency(totalBookValue)}</b>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="d-flex flex-column">
      <div className="d-flex" data-testid="capital-row-TOTAL">
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
        <div className="d-flex" key={amount.type} data-testid={`capital-row-${amount.type}`}>
          <div className="col">
            – <TransferAmountName type={amount.type} />
          </div>
          <div className="col">{formatAmountForCurrency(amount.bookValue)}</div>
        </div>
      ))}
    </div>
  );
};

const TransferAmountName = ({ type }: { type: CapitalType }) => {
  if (type === 'CAPITAL_ACQUIRED') {
    return <>omandatud liikmekapital</>;
  }
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
