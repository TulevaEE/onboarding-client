import React from 'react';
import Types from 'prop-types';
import { Message } from 'retranslate';

import { Loader } from '../common';

const formatPercentage = percentage => (percentage ? `${(percentage * 100).toFixed(1)}%` : '-');

const ReturnComparison = ({ loading, actualPercentage, estonianPercentage, marketPercentage }) => (
  <div className="card card-primary p-4">
    {loading ? (
      <Loader className="align-middle mt-2" />
    ) : (
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
    )}

    <div className="text-center mt-2">
      <a
        href="https://docs.google.com/document/d/1tKHNIUmQjPpO8cmZUOcVbWZR1yBZfuZnUNUDmxs9T4A"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Message>returnComparison.explanationLinkText</Message>
      </a>
    </div>
  </div>
);

ReturnComparison.propTypes = {
  loading: Types.bool,
  actualPercentage: Types.number,
  estonianPercentage: Types.number,
  marketPercentage: Types.number,
};

ReturnComparison.defaultProps = {
  loading: false,
  actualPercentage: null,
  estonianPercentage: null,
  marketPercentage: null,
};

export default ReturnComparison;
