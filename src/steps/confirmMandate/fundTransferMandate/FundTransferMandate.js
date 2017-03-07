import React, { PropTypes as Types } from 'react';

import { Message } from 'retranslate';

const FundTransferMandate = ({ selection }) => (
  <div className="mt-4">
    <Message>confirm.mandate.switch</Message>
    <b>
      {
        selection.percentage === 1 ?
          <Message>confirm.mandate.amounts.all</Message> :
          `${selection.percentage * 100}%`
      }
    </b>
    <Message>confirm.mandate.under.my.control</Message>
    <b>{selection.sourceFundName}</b>
    <Message>confirm.mandate.shares</Message>
    <b className="highlight">
      <Message>
        {`target.funds.${selection.targetFundIsin}.title`}
      </Message>
    </b>
    <Message>confirm.mandate.for.shares</Message>
  </div>
);

FundTransferMandate.propTypes = {
  selection: Types.shape({
    percentage: Types.number.isRequired,
    sourceFundName: Types.string.isRequired,
    targetFundIsin: Types.string.isRequired,
  }).isRequired,
};

export default FundTransferMandate;
