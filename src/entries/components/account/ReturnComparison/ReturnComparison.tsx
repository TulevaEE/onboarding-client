import React, { FC } from 'react';
import { Message } from 'retranslate';

import { Loader } from '../../common';

type NullableNumber = number | null;

const formatPercentage = (percentage: NullableNumber): string =>
  percentage ? `${(percentage * 100).toFixed(1)}%` : '-';

interface ReturnComparisonProps {
  loading?: boolean;
  personal?: NullableNumber;
  pensionFund?: NullableNumber;
  index?: NullableNumber;
}

const ReturnComparison: FC<ReturnComparisonProps> = ({
  loading = false,
  personal = null,
  pensionFund = null,
  index = null,
}) => (
  <div className="card card-primary p-4">
    {loading ? (
      <Loader className="align-middle mt-2" />
    ) : (
      <div className="row">
        <div className="col-sm-4 text-center">
          <Message>returnComparison.actual</Message>
          <div className="h2 text-success mt-2">{formatPercentage(personal)}</div>
        </div>
        <div className="col-sm-4 text-center">
          <Message>returnComparison.estonian</Message>
          <div className="h2 mt-2">{formatPercentage(pensionFund)}</div>
        </div>
        <div className="col-sm-4 text-center">
          <Message>returnComparison.market</Message>
          <div className="h2 text-primary mt-2">{formatPercentage(index)}</div>
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

export default ReturnComparison;
