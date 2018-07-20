import React from 'react';
import Types from 'prop-types';
import { Message } from 'retranslate';

const formatPercentage = percentage => (percentage ? `${(percentage * 100).toFixed(1)}%` : '-');

const ReturnComparison = ({ actualPercentage, estonianPercentage, marketPercentage }) => (
  <div className="card card-primary p-4">
    <div className="row">
      <div className="col-sm-4 text-center">
        <Message>returnComparison.actual</Message>
        <div className="h2 text-success mt-2">{formatPercentage(actualPercentage)}</div>
      </div>
      <div className="col-sm-4 text-center">
        <Message>returnComparison.estonian</Message>
        <div className="h2 mt-2">{formatPercentage(estonianPercentage)}</div>
      </div>
      <div className="col-sm-4 text-center">
        <Message>returnComparison.market</Message>
        <div className="h2 text-primary mt-2">{formatPercentage(marketPercentage)}</div>
      </div>
    </div>
  </div>
);

ReturnComparison.propTypes = {
  actualPercentage: Types.number,
  estonianPercentage: Types.number,
  marketPercentage: Types.number,
};

ReturnComparison.defaultProps = {
  actualPercentage: null,
  estonianPercentage: null,
  marketPercentage: null,
};

export default ReturnComparison;
