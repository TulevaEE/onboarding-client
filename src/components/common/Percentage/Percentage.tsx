import React, { FC } from 'react';

interface PercentageProps {
  value: number;
  stripTrailingZeros?: boolean;
  className?: string;
}

const Percentage: FC<PercentageProps> = ({ value, stripTrailingZeros = false, className }) => (
  <span className={`${className || ''}${value === 0 ? ' text-muted' : ''}`}>
    {formatPercentage(value, stripTrailingZeros)}
  </span>
);

function formatPercentage(value: number, stripTrailingZeros = false): string {
  const percent = (value * 100).toFixed(2);
  const formattedValue = stripTrailingZeros ? Number(percent) : percent;
  return `${formattedValue}%`;
}

export default Percentage;
