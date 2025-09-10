import { FormattedMessage } from 'react-intl';
import { CapitalType } from '../../../common/apiModels';
import { CapitalTransferAmount } from '../../../common/apiModels/capital-transfer';
import { formatAmountForCurrency } from '../../../common/utils';
import { sortTransferAmounts } from '../create/utils';
import { isTranslationKey } from '../../../translations';

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
        <div className="row" data-testid="capital-row-TOTAL">
          <div className="col pe-0">
            <b>
              <FormattedMessage id="capital.transfer.details.amount.total" />
            </b>{' '}
            <span className="d-block" data-testid={`capital-row-${amount.type}`}>
              (<TransferAmountName type={amount.type} />)
            </span>
          </div>
          <div className="col-auto col-sm text-nowrap text-end text-sm-start">
            <b>{formatAmountForCurrency(totalBookValue)}</b>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="d-flex flex-column">
      <div className="row" data-testid="capital-row-TOTAL">
        <div className="col pe-0">
          <b>
            <FormattedMessage id="capital.transfer.details.amount.total" />
          </b>
        </div>
        <div className="col-auto col-sm text-nowrap text-end text-sm-start">
          <b>{formatAmountForCurrency(totalBookValue)}</b>
        </div>
      </div>

      {sortedAmounts.map((amount) => (
        <div className="row" key={amount.type} data-testid={`capital-row-${amount.type}`}>
          <div className="col pe-0">
            – <TransferAmountName type={amount.type} />
          </div>
          <div className="col-auto col-sm text-nowrap text-end text-sm-start">
            {formatAmountForCurrency(amount.bookValue)}
          </div>
        </div>
      ))}
    </div>
  );
};

const TransferAmountName = ({ type }: { type: CapitalType }) => {
  const key = `capital.transfer.details.amount.type.${type}`;
  if (isTranslationKey(key)) {
    return <FormattedMessage id={key} />;
  }
  return null;
};
