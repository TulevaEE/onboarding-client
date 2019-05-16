import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import FundRow from './FundRow';
import './FundsOverviewTable.scss';
import { getTotalFundValue } from '../../common/utils';
import { getSumOfPillars } from './fundCalculations';

const FundsOverviewTable = ({ funds }) => {
  const sumOfPillars = getSumOfPillars(funds);

  console.log(JSON.stringify(funds));
  console.log('----- Some -----');
  console.log(JSON.stringify(sumOfPillars));

  const totalPrice = getTotalFundValue(funds);

  return (
    <div>
      <div className="row tv-table__header py-2">
        <div className="col-12 col-sm">
          <Message>select.sources.overview.title</Message>
        </div>
        <div className="col-12 col-sm text-sm-right">
          <Message>select.sources.value</Message>
        </div>
        {/*
          <div className="col-12 col-sm text-sm-right">
            <Message>select.sources.fees</Message>
          </div>
           */}
      </div>
      {JSON.stringify(sumOfPillars)}
      {/* { */}
      {/*  summedByPillar.forEach((value, key) => ( */}
      {/*      <div>Help {key}</div> */}
      {/*    ) */}
      {/*  ) */}
      {/* } */}

      <FundRow
        price={totalPrice}
        currency="EUR" // hardcoded until there are more currencies
        name="select.sources.total"
        highlighted
      />

      <br />
      <br />

      <div className="mt-2">
        <small className="text-muted">
          <Message>select.sources.active.fund</Message>
        </small>
      </div>
    </div>
  );
};

FundsOverviewTable.defaultProps = {
  funds: [],
};

FundsOverviewTable.propTypes = {
  funds: Types.arrayOf(
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

export default FundsOverviewTable;
