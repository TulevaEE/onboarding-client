import React from 'react';
import { FormattedMessage } from 'react-intl';
import Percentage from './Percentage';

interface FeesProps {
  value: number;
  className?: string;
  showPerYear?: boolean;
}

export const Fees: React.FC<FeesProps> = ({ value, className, showPerYear }) => {
  if (value <= 0) {
    return <></>;
  }
  return (
    <span className={`${className || ''} ${value > 0.005 ? ' text-danger' : 'text-success'}`}>
      <Percentage value={value} />
      {showPerYear && <FormattedMessage id="fees.perYear" />}
    </span>
  );
};
