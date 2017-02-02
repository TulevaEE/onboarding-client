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
          <Message>select.sources.pension.fund</Message>
        </div>
        <div className="col-12 col-sm text-sm-right">
          <Message>select.sources.value</Message>
        </div>
        <div className="col-12 col-sm text-sm-right">
          <Message>select.sources.fees</Message>
        </div>
      </div>
      {
        funds.map(({ currency, price, name, isin }) =>
          <FundRow
            key={isin}
            price={price}
            name={name}
            currency={currency}
          />,
        )
      }
      <FundRow
        price={totalPrice}
        currency={'EUR'} // hardcoded until there are more currencies
        name={'select.sources.total'}
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
