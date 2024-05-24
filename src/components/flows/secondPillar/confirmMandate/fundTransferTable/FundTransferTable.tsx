import './FundTransferTable.scss';

import { FormattedMessage } from 'react-intl';

type Props = {
  selections: {
    sourceFundIsin: string;
    sourceFundName: string;
    targetFundName: string;
    targetFundIsin: string;
    percentage: number;
  }[];
};

export const FundTransferTable = ({ selections = [] }: Props) => (
  <div>
    <div className="row tv-table__header py-2">
      <div className="col-12 col-sm">
        <FormattedMessage id="confirm.mandate.current.fund" />
      </div>
      <div className="col-12 col-sm">
        <FormattedMessage id="confirm.mandate.future.fund" />
      </div>
      <div className="col-12 col-sm-2">
        <FormattedMessage id="confirm.mandate.percentage" />
      </div>
    </div>
    {selections.map((selection, index) => (
      <div className="row tv-table__row py-2" key={index}>
        <div className="col-12 col-sm">{selection.sourceFundName}</div>
        <div className="col-12 col-sm">
          <b className="highlight">{selection.targetFundName}</b>
        </div>
        <div className="col-12 col-sm-2">{selection.percentage * 100}%</div>
      </div>
    ))}
  </div>
);
