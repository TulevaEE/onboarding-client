import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import './PensionFundOverview.scss';

import { formatAmountForCurrency } from '../../../common/utils';

function calculateTotalFromFunds(funds = []) {
  return funds.reduce((sum, { price }) => sum + price, 0);
}

const PensionFundOverview = ({ funds }) => (
  <div>
    <div className="row tv-table__header tv-table__header--rounded py-2">
      <div className="col-12 col-sm">
        <Message>select.sources.pension.fund</Message>
      </div>
      <div className="col-12 col-sm text-sm-right">
        <Message>select.sources.value</Message>
      </div>
    </div>
    {
      funds.map(fund => (
        <div key={fund.isin} className="row tv-table__row tv-table__row--rounded py-2">
          <div className="col-12 col-sm">
            <Message>{fund.name}</Message>
            {/* TODO: add stuff about the mandate here */}
          </div>
          <div className="col-12 col-sm text-sm-right">
            {formatAmountForCurrency(fund.price, fund.currency)}
          </div>
        </div>
      ))
    }
    <div className="row tv-table__footer tv-table__footer--rounded py-2">
      <div className="col-12 col-sm">
        <b><Message>account.current.balance.total</Message></b>
      </div>
      <div className="col-12 col-sm text-sm-right">
        <b>
          {
            formatAmountForCurrency(
              calculateTotalFromFunds(funds),
              (funds.length ? funds[0].currency : 'EUR'),
            )
          }
        </b>
      </div>
    </div>
  </div>
);

PensionFundOverview.defaultProps = {
  funds: [],
};

PensionFundOverview.propTypes = {
  funds: Types.arrayOf(Types.shape({
    name: Types.string.isRequired,
    isin: Types.string.isRequired,
    price: Types.number.isRequired,
    currency: Types.string.isRequired,
  })),
};

export default PensionFundOverview;
