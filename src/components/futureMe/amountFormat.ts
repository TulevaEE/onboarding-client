import { formatAmountForCount, formatAmountForCurrency } from '../common/utils';

const DECIMAL_FRACTION_DIGITS = 1;
const PERCENT_FRACTION_DIGITS = 2;
const TRAILING_ZERO_DECIMAL = /,0$/;
const TRAILING_ZEROS = /,?0+$/;

const MINUS_SIGN = '\u2212';

export const signedNumber = (value: number): string => String(value).replace('-', MINUS_SIGN);

export const euro = (value: number): string => formatAmountForCurrency(Math.round(value), 0);

export const decimalText = (value: number): string =>
  formatAmountForCount(value, DECIMAL_FRACTION_DIGITS)
    .replace('.', ',')
    .replace(TRAILING_ZERO_DECIMAL, '');

export const exactPercent = (fraction: number): string =>
  `${(fraction * 100)
    .toFixed(PERCENT_FRACTION_DIGITS)
    .replace('.', ',')
    .replace(TRAILING_ZEROS, '')}%`;

export const signedPercent = (fraction: number): string =>
  exactPercent(fraction).replace('-', MINUS_SIGN);
