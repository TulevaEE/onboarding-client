import React, { FC } from 'react';

interface PercentageProps {
  value: number;
}

const Percentage: FC<PercentageProps> = ({ value }) => <>{formatPercentage(value)}</>;

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export default Percentage;
