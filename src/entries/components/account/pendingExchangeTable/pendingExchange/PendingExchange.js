import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

const PendingExchange = ({ amount, date, sourceFund, targetFund }) => (
  <div className="row tv-table__row py-2">
    <div className="col-12 col-sm">
      <Message>{sourceFund.name}</Message>
    </div>
    <div className="col-12 col-sm">
      <Message>{targetFund.name}</Message>
    </div>
    <div className="col-12 col-sm">
      <Message>
        {new Date(date).getFullYear()}-
        {`0${new Date(date).getMonth() + 1}`.slice(-2)}-
        {`0${new Date(date).getDate()}`.slice(-2)}
      </Message>
    </div>
    <div className="col-12 col-sm text-sm-right">
      <Message>{Math.round(amount * 100)}</Message>%
    </div>
  </div>
);

PendingExchange.defaultProps = {
  amount: 0,
  date: null,
  sourceFund: null,
  targetFund: null,
};

PendingExchange.propTypes = {
  amount: Types.number,
  date: Types.string,
  sourceFund: Types.shape({}),
  targetFund: Types.shape({}),
};

export default PendingExchange;
