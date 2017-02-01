import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

function formatForCurrency(amount) {
  return `${amount}€`; // hardcoded until more currencies.
}

const FundRow = ({ price, currency, name, highlighted }) => (
  <div className="row tv-table__row py-2">
    <div className="col-12 col-sm">
      { highlighted ? <b><Message>{name}</Message></b> : <Message>{name}</Message> }
    </div>
    <div className="col-12 col-sm text-sm-right">
      {
        highlighted ?
          <b>{formatForCurrency(price, currency)}</b> :
          formatForCurrency(price, currency)
      }
    </div>
    <div className="col-12 col-sm text-sm-right">TODO</div>
  </div>
);

FundRow.defaultProps = {
  price: 0,
  currency: 'EUR',
  key: '',
  name: '',
  highlighted: false,
};

FundRow.propTypes = {
  price: Types.number,
  currency: Types.string,
  name: Types.oneOfType([Types.node, Types.string]),
  highlighted: Types.bool,
};

export default FundRow;
