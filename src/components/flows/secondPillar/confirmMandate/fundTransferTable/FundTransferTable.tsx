import './FundTransferTable.scss';
import { PropsWithChildren } from 'react';
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
  <div className="fund-selections-container">
    <div className="pt-3 px-3">
      <FormattedMessage id="confirm.mandate.transferExisting" />
    </div>
    {selections.map((selection, index) => (
      <div key={index}>
        <div className="px-3 pb-3 d-flex flex-column flex-md-row justify-content-between">
          <TransferDataPoint className="flex-grow-0 flex-shrink-0 fund-selections-current-fund">
            <FormattedMessage id="confirm.mandate.current.fund" />
            <b>{selection.sourceFundName}</b>
          </TransferDataPoint>
          <TransferDataPoint className="flex-grow-1">
            <FormattedMessage id="confirm.mandate.future.fund" />
            <b>
              <span className="highlight">{selection.targetFundName}</span>
            </b>
          </TransferDataPoint>
          <TransferDataPoint className="flex-grow-0 flex-shrink-0">
            <FormattedMessage id="confirm.mandate.percentage" />
            <b>{selection.percentage * 100}%</b>
          </TransferDataPoint>
        </div>

        {selections.length > 1 && index !== selections.length - 1 && (
          <div className="fund-selection-divider ml-3" />
        )}
      </div>
    ))}
  </div>
);

const TransferDataPoint = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div className={`pt-2 d-flex flex-column justify-start ${className ?? ''}`}>{children}</div>
);
