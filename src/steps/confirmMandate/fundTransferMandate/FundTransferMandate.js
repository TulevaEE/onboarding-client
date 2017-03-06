import React, { PropTypes as Types } from 'react';

import { Message } from 'retranslate';

const FundTransferMandate = ({ fund, targetFund }) => (
  <div className="mt-4">
    <Message>confirm.mandate.switch</Message>
    <b>
      {
        fund.percentage === 1 ?
          <Message>confirm.mandate.amounts.all</Message> :
          `${fund.percentage * 100}%`
      }
    </b>
    <Message>confirm.mandate.under.my.control</Message>
    <b>{fund.name}</b>
    <Message>confirm.mandate.shares</Message>
    <b className="highlight">
      <Message>
        {`target.funds.${targetFund.isin}.title`}
      </Message>
    </b>
    <Message>confirm.mandate.for.shares</Message>
  </div>
);

FundTransferMandate.propTypes = {
  fund: Types.shape({
    name: Types.string.isRequired,
    percentage: Types.number.isRequired,
  }).isRequired,
  targetFund: Types.shape({ isin: Types.string.isRequired }).isRequired,
};

export default FundTransferMandate;
