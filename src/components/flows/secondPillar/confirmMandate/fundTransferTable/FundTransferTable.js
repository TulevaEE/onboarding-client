/* eslint-disable react/no-array-index-key */
import React from 'react';
import { PropTypes as Types } from 'prop-types';

import { Message } from 'retranslate';

const FundTransferTable = ({ selections }) => (
  <div>
    <div className="row tv-table__header py-2">
      <div className="col-12 col-sm">
        <Message>confirm.mandate.current.fund</Message>
      </div>
      <div className="col-12 col-sm-2">
        <Message>confirm.mandate.percentage</Message>
      </div>
      <div className="col-12 col-sm">
        <Message>confirm.mandate.future.fund</Message>
      </div>
    </div>
    {selections.map((selection, index) => (
      <div className="row tv-table__row py-2" key={index}>
        <div className="col-12 col-sm">{selection.sourceFundName}</div>
        <div className="col-12 col-sm-2">{selection.percentage * 100}%</div>
        <div className="col-12 col-sm">
          <b className="highlight">{selection.targetFundName}</b>
        </div>
      </div>
    ))}
  </div>
);

FundTransferTable.defaultProps = {
  selections: [],
};

FundTransferTable.propTypes = {
  selections: Types.arrayOf(
    Types.shape({
      sourceFundIsin: Types.string,
      sourceFundName: Types.string,
      targetFundIsin: Types.string,
      percentage: Types.number,
    }),
  ),
};

export default FundTransferTable;
