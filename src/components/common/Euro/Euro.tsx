import React, { FC } from 'react';

import { formatAmountForCurrency } from '../utils';

interface Props {
  amount: number;
}

const Euro: FC<Props> = ({ amount }) => <>{formatAmountForCurrency(amount)}</>;

export default Euro;
