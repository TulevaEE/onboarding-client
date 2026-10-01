import { formatAmountForCount } from './utils';

const TUK75_ISIN = 'EE3600109435';
const TUK00_ISIN = 'EE3600109443';
const TUV100_ISIN = 'EE3600001707';
const TKF100_ISIN = 'EE0000003283';

const NAV_SCALE_BY_ISIN: Record<string, number> = {
  [TUK75_ISIN]: 5,
  [TUK00_ISIN]: 5,
  [TUV100_ISIN]: 4,
  [TKF100_ISIN]: 4,
};

const MIN_NAV_SCALE = 5;

function decimalPlaces(n: number): number {
  const str = String(n);
  const dotIndex = str.indexOf('.');
  return dotIndex === -1 ? 0 : str.length - dotIndex - 1;
}

export function navScaleFor(isin: string | undefined, nav: number): number {
  const known = isin === undefined ? undefined : NAV_SCALE_BY_ISIN[isin];
  if (known !== undefined) {
    return known;
  }
  return Math.max(MIN_NAV_SCALE, decimalPlaces(nav));
}

const REGISTER_UNITS_FRACTION_DIGITS = 5;
export const UNITS_FRACTION_DIGITS = 3;

function hundredThousandths(units: number): number {
  return Number(Math.abs(units).toFixed(REGISTER_UNITS_FRACTION_DIGITS).replace('.', ''));
}

function registerUnits(units: number): number {
  return Number(units.toFixed(REGISTER_UNITS_FRACTION_DIGITS));
}

export function roundUnits(units: number): number {
  const thousandths = Math.round(hundredThousandths(units) / 100);
  return (Math.sign(units) * thousandths) / 1000;
}

export function isRoundedUnits(units: number): boolean {
  return roundUnits(units) !== registerUnits(units);
}

export function formatUnits(units: number): string {
  return formatAmountForCount(roundUnits(units), UNITS_FRACTION_DIGITS);
}

export function formatExactUnits(units: number): string {
  const exact = registerUnits(units);
  return formatAmountForCount(exact, Math.max(UNITS_FRACTION_DIGITS, decimalPlaces(exact)));
}
