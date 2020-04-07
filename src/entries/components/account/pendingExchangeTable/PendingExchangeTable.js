import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

import PendingExchange from './pendingExchange';

import './PendingExchangeTable.scss';

const PendingExchangeTable = ({ pendingExchanges }) => (
  <div>
    <div className="row tv-table__header py-2">
      <div className="col-12 col-sm">
        <Message>pending.exchanges.source.fund.isin</Message>
      </div>
      <div className="col-12 col-sm">
        <Message>pending.exchanges.target.fund.isin</Message>
      </div>
      <div className="col-12 col-sm">
        <Message>pending.exchanges.date</Message>
      </div>
      <div className="col-12 col-sm text-sm-right">
        <Message>pending.exchanges.amount</Message>
      </div>
    </div>
    {pendingExchanges.map(({ amount, date, sourceFund, targetFund }) => (
      <PendingExchange
        key={sourceFund.isin + targetFund.isin + date}
        amount={amount}
        date={date}
        sourceFund={sourceFund}
        targetFund={targetFund}
      />
    ))}
  </div>
);

PendingExchangeTable.defaultProps = {
  pendingExchanges: [],
};

PendingExchangeTable.propTypes = {
  pendingExchanges: Types.arrayOf(
    Types.shape({
      price: Types.number,
      currency: Types.string,
      name: Types.string,
      manager: Types.string,
      isin: Types.string,
      activeFund: Types.bool,
    }),
  ),
};

export default PendingExchangeTable;
