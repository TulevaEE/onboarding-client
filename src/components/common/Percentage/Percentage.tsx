import React, { FC } from 'react';

interface PercentageProps {
  value: number;
}

const Percentage: FC<PercentageProps> = ({ value }) => (
  <span className={value === 0 ? 'text-muted' : undefined}>{formatPercentage(value)}</span>
);

function formatPercentage(value: number): string {
  return `${Number((value * 100).toFixed(2))}%`;
}

export default Percentage;
