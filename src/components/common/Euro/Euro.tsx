import React, { FC } from 'react';

import { formatAmountForCurrency } from '../utils';

interface Props {
  amount: number;
  fractionDigits?: number;
}

const Euro: FC<Props> = ({ amount, fractionDigits = 2 }) => (
  <span className={amount === 0 ? 'text-muted' : undefined}>
    {formatAmountForCurrency(amount, fractionDigits)}
  </span>
);

export default Euro;
