import { formatAmountForCurrency } from '../utils';

interface Props {
  amount: number;
  fractionDigits?: number;
  className?: string;
}

export const Euro = ({ amount, fractionDigits = 2, className }: Props) => (
  <span className={`${className || ''} ${amount === 0 ? 'text-muted' : ''} text-nowrap`}>
    {formatAmountForCurrency(amount, fractionDigits)}
  </span>
);
