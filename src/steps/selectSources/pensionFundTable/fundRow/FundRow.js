import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

function formatForCurrency(amount) {
  return `${amount.toFixed(2)}€`; // hardcoded euro until more currencies.
}

const FundRow = ({ price, currency, name, highlighted }) => {
  const displayName = <Message>{name}</Message>;
  const displayPrice = formatForCurrency(price, currency);
  return (
    <div className="row tv-table__row py-2">
      <div className="col-12 col-sm">
        { highlighted ? <b>{displayName}</b> : displayName }
      </div>
      <div className="col-12 col-sm text-sm-right">
        { highlighted ? <b>{displayPrice}</b> : displayPrice }
      </div>
      <div className="col-12 col-sm text-sm-right">TODO</div>
    </div>
  );
};

FundRow.defaultProps = {
  price: 0,
  currency: 'EUR',
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
