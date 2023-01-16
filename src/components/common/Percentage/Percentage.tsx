import React, { FC } from 'react';

interface PercentageProps {
  value: number;
  className?: string;
}

const Percentage: FC<PercentageProps> = ({ value, className }) => (
  <span className={`${className || ''}${value === 0 ? ' text-muted' : ''}`}>
    {formatPercentage(value)}
  </span>
);

export function formatPercentage(value: number): string {
  return `${Number((value * 100).toFixed(2))}%`;
}

export default Percentage;
