import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import FundRow from './fundRow';

import './PensionFundTable.scss';

const PensionFundTable = ({ funds }) => {
  const totalPrice = (funds || []).reduce((sum, { price }) => sum + price, 0);
  return (
    <div>
      <div className="row tv-table__header py-2">
        <div className="col-12 col-sm">
          <Message>select.exchange.pension.fund</Message>
        </div>
        <div className="col-12 col-sm text-sm-right">
          <Message>select.exchange.value</Message>
        </div>
        <div className="col-12 col-sm text-sm-right">
          <Message>select.exchange.fees</Message>
        </div>
      </div>
      {
        funds.map(({ currency, price, name, manager, isin }) =>
          <FundRow
            key={isin}
            price={price}
            name={`${manager} ${name}`}
            currency={currency}
          />,
        )
      }
      <FundRow
        price={totalPrice}
        currency={'EUR'}
        name={'select.exchange.total'}
        highlighted
      />
    </div>
  );
};

PensionFundTable.defaultProps = {
  funds: [],
};

PensionFundTable.propTypes = {
  funds: Types.arrayOf(Types.shape({
    price: Types.number,
    currency: Types.string,
    name: Types.string,
    manager: Types.string,
    isin: Types.string,
  })),
};

export default PensionFundTable;
