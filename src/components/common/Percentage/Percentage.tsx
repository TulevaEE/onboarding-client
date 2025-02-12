import React, { FC } from 'react';

interface PercentageProps {
  value: number;
  fractionDigits?: number;
  stripTrailingZeros?: boolean;
  className?: string;
  alwaysSingleColor?: boolean;
}

const Percentage: FC<PercentageProps> = ({
  value,
  fractionDigits = 2,
  stripTrailingZeros = false,
  alwaysSingleColor = false,
  className,
}) => (
  <span
    className={`${className || ''}${
      value === 0 && !alwaysSingleColor ? ' text-body-secondary' : ''
    }`}
  >
    {formatPercentage(value, fractionDigits, stripTrailingZeros)}
  </span>
);

function formatPercentage(value: number, fractionDigits = 2, stripTrailingZeros = false): string {
  const percent = (value * 100).toFixed(fractionDigits);
  const formattedValue = stripTrailingZeros ? Number(percent) : percent;
  return `${formattedValue}%`;
}

export default Percentage;
