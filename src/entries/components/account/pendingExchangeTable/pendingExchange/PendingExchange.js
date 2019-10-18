import React from 'react';
import { PropTypes as Types } from 'prop-types';

function getAmount(amount, sourceFund, targetFund) {
  if (sourceFund.pillar === 2 && targetFund.pillar === 2) {
    return `${Math.round(amount * 100)}%`;
  }
  return amount;
}

const PendingExchange = ({ amount, date, sourceFund, targetFund }) => (
  <div className="row tv-table__row py-2">
    <div className="col-12 col-sm">{sourceFund.name}</div>
    <div className="col-12 col-sm">{targetFund.name}</div>
    <div className="col-12 col-sm">
      {new Date(date).getFullYear()}-{`0${new Date(date).getMonth() + 1}`.slice(-2)}-
      {`0${new Date(date).getDate()}`.slice(-2)}
    </div>
    <div className="col-12 col-sm text-sm-right">{getAmount(amount, sourceFund, targetFund)}</div>
  </div>
);

PendingExchange.defaultProps = {
  amount: 0,
  date: null,
  sourceFund: {},
  targetFund: {},
};

PendingExchange.propTypes = {
  amount: Types.number,
  date: Types.string,
  sourceFund: Types.shape({
    name: Types.string,
  }),
  targetFund: Types.shape({
    name: Types.string,
  }),
};

export default PendingExchange;
