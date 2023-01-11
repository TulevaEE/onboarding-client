import React, { FC } from 'react';

import { formatAmountForCurrency } from '../utils';

interface Props {
  amount: number;
  fractionDigits?: number;
}

const Euro: FC<Props> = ({ amount, fractionDigits = 2 }) => (
  <>{formatAmountForCurrency(amount, fractionDigits)}</>
);

export default Euro;
