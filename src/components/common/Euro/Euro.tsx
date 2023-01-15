import React, { FC } from 'react';

import { formatAmountForCurrency } from '../utils';

interface Props {
  amount: number;
  fractionDigits?: number;
  className?: string;
}

const Euro: FC<Props> = ({ amount, fractionDigits = 2, className }) => (
  <span className={`${className || ''}${amount === 0 ? ' text-muted' : ''}`}>
    {formatAmountForCurrency(amount, fractionDigits)}
  </span>
);

export default Euro;
