import React from 'react';
import { formatAmountForCurrency } from '../../common/utils';
import { PII_CLASS } from '../../tracking/piiMarkup';

const SMALLEST_AMOUNT_WITH_THOUSANDS_SEPARATOR = 10000;

export const formatAmount = (amount: number) => {
  const wholeEuros = Math.floor(amount);
  const formatted = formatAmountForCurrency(wholeEuros, 0);
  return Math.abs(wholeEuros) < SMALLEST_AMOUNT_WITH_THOUSANDS_SEPARATOR
    ? formatted.replace(/(\d) (?=\d)/g, '$1')
    : formatted;
};

type Props = {
  amount: number;
  className?: string;
};

export const Amount = ({ amount, className = '' }: Props) => (
  <span className={`${className} text-nowrap ${PII_CLASS}`}>{formatAmount(amount)}</span>
);
