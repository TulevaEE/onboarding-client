import React from 'react';
import Percentage from './Percentage';

interface FeesProps {
  value: number;
  className?: string;
}

export const Fees: React.FC<FeesProps> = ({ value, className }) => {
  if (value <= 0) {
    return <></>;
  }
  return (
    <Percentage
      className={`${className || ''} ${value > 0.005 ? ' text-danger' : 'text-success'}`}
      value={value}
    />
  );
};
