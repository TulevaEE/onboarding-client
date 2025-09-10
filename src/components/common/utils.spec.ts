import { Fund } from './apiModels';
import {
  findWhere,
  createClamper,
  formatAmountForCurrency,
  isThirdPillar,
  isSecondPillar,
  isActive,
  isTuleva,
  formatAmountForCount,
} from './utils';

describe('Utils', () => {
  describe('findWhere', () => {
    it('finds the first item in a list where a predicate matches', () => {
      const list = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = findWhere(list, (item) => item * item === 16);
      expect(result).toBe(4);
    });

    it('returns null if it cannot find an element where the predicate matches', () => {
      const list = [1, 2, 3, 5, 6, 7, 8];
      const result = findWhere(list, (item) => item * item === 16);
      expect(result).toBe(null);
    });

    it('works for falsy items', () => {
      const list = [true, true, false, true];
      expect(findWhere(list, (element) => !element)).toBe(false);
    });

    it('works for objects', () => {
      const list = [
        { findMe: false, id: 0 },
        { findMe: true, id: 1 },
        { findMe: false, id: 2 },
      ];
      expect(findWhere(list, (element) => element.findMe)).toBe(list[1]);
    });

    it('handles empty arguments', () => {
      expect(findWhere()).toBe(null);
      expect(findWhere([0, 1, 2, 3])).toBe(1);
      expect(findWhere([false, false, true, false])).toBe(true);
      expect(findWhere(undefined, () => true)).toBe(null);
    });
  });

  describe('createClamper', () => {
    it('creates a clamping function that clamps values between a maximum and minimum', () => {
      const clampFromSevenToEleven = createClamper(7, 11);
      expect(clampFromSevenToEleven(7)).toBe(7);
      expect(clampFromSevenToEleven(11)).toBe(11);
      expect(clampFromSevenToEleven(8.5)).toBe(8.5);
      expect(clampFromSevenToEleven(10)).toBe(10);
      expect(clampFromSevenToEleven(6.9)).toBe(7);
      expect(clampFromSevenToEleven(13)).toBe(11);
      expect(clampFromSevenToEleven(-100)).toBe(7);
    });

    it('has some default values for limits', () => {
      const defaultClamp = createClamper();
      expect(defaultClamp(5)).toBe(5);
    });
  });

  const NBSP = '\u00A0';
  const UMINUS = '−';

  describe('formatAmountForCurrency', () => {
    it('gives a fixed number with a euro sign after it', () => {
      expect(formatAmountForCurrency(123.456)).toBe(`123.46${NBSP}€`);
      expect(formatAmountForCurrency(0.000456)).toBe(`0.00${NBSP}€`);
      expect(formatAmountForCurrency(5)).toBe(`5.00${NBSP}€`);
    });

    it('handles no arguments', () => {
      expect(formatAmountForCurrency()).toBe(`0.00${NBSP}€`);
    });

    it('has a thousands separator', () => {
      expect(formatAmountForCurrency(12345678.9)).toBe(`12${NBSP}345${NBSP}678.90${NBSP}€`);
    });

    it('can format with less fractional digits', () => {
      expect(formatAmountForCurrency(12345678.97, 0)).toBe(`12${NBSP}345${NBSP}679${NBSP}€`);
    });

    it('can format with a plus sign', () => {
      expect(formatAmountForCurrency(12345678.97, 0, { isSigned: true })).toBe(
        `+12${NBSP}345${NBSP}679${NBSP}€`,
      );
    });

    it('can format with a minus sign (uses Unicode minus)', () => {
      expect(formatAmountForCurrency(-12345678.97, 0, { isSigned: true })).toBe(
        `${UMINUS}12${NBSP}345${NBSP}679${NBSP}€`,
      );
    });

    it('does not add a plus sign for zero when isSigned=true', () => {
      expect(formatAmountForCurrency(0, 2, { isSigned: true })).toBe(`0.00${NBSP}€`);
    });
  });

  describe('formatAmountForCurrency with smartDecimals=true', () => {
    it('uses fractionDigits as the minimum and expands to reveal a significant digit for tiny values', () => {
      // Very small positive amount -> show first non-zero digit
      expect(formatAmountForCurrency(0.0000001, 2, { smartDecimals: true })).toBe(
        `0.0000001${NBSP}€`,
      );
    });

    it('keeps exactly the minimum when magnitude is >= 1', () => {
      expect(formatAmountForCurrency(12.3, 2, { smartDecimals: true })).toBe(`12.30${NBSP}€`);
      expect(formatAmountForCurrency(12, 0, { smartDecimals: true })).toBe(`12${NBSP}€`);
    });

    it('handles zero with the minimum decimals', () => {
      expect(formatAmountForCurrency(0, 2, { smartDecimals: true })).toBe(`0.00${NBSP}€`);
    });

    it('uses Unicode minus for tiny negative values as well', () => {
      expect(formatAmountForCurrency(-0.0000001, 2, { smartDecimals: true })).toBe(
        `${UMINUS}0.0000001${NBSP}€`,
      );
    });

    it('still inserts thousands separators with smart decimals', () => {
      expect(formatAmountForCurrency(12345.00009, 2, { smartDecimals: true })).toBe(
        `12${NBSP}345.00${NBSP}€`,
      );
    });

    it('handles NaN gracefully (mirrors JS toFixed behavior)', () => {
      expect(
        formatAmountForCurrency(Number.NaN as unknown as number, 2, { smartDecimals: true }),
      ).toBe(`NaN${NBSP}€`);
    });
  });

  describe('formatAmountForCount', () => {
    it('uses fixed fraction digits by default', () => {
      expect(formatAmountForCount(123.456)).toBe('123.46');
      expect(formatAmountForCount(0.000456)).toBe('0.00');
    });

    it('thousands separator (NBSP)', () => {
      expect(formatAmountForCount(12345678.9, 2)).toBe(`12${NBSP}345${NBSP}678.90`);
    });

    it('plus sign only when isSigned=true and value > 0', () => {
      expect(formatAmountForCount(5, 2, { isSigned: true })).toBe('+5.00');
      expect(formatAmountForCount(0, 2, { isSigned: true })).toBe('0.00');
    });

    it('uses Unicode minus for negatives', () => {
      expect(formatAmountForCount(-5, 0)).toBe(`${UMINUS}5`);
    });
  });

  describe('formatAmountForCount with smartDecimals=true', () => {
    it('treats the provided fractionDigits as the minimum', () => {
      expect(formatAmountForCount(0.009, 2, { smartDecimals: true })).toBe('0.009');
      expect(formatAmountForCount(0.09, 2, { smartDecimals: true })).toBe('0.09');
      expect(formatAmountForCount(0.5, 2, { smartDecimals: true })).toBe('0.50');
    });

    it('does not expand decimals for |value| >= 1', () => {
      expect(formatAmountForCount(1.2, 2, { smartDecimals: true })).toBe('1.20');
      expect(formatAmountForCount(1234.5, 2, { smartDecimals: true })).toBe(`1${NBSP}234.50`);
    });

    it('handles negative tiny values with the Unicode minus', () => {
      expect(formatAmountForCount(-0.0000001, 2, { smartDecimals: true })).toBe(
        `${UMINUS}0.0000001`,
      );
    });

    it('keeps zero at the minimum decimals', () => {
      expect(formatAmountForCount(0, 3, { smartDecimals: true })).toBe('0.000');
    });

    it('does not throw on NaN (returns "NaN")', () => {
      expect(
        formatAmountForCount(Number.NaN as unknown as number, 2, { smartDecimals: true }),
      ).toBe('NaN');
    });

    it('internal safety cap does not explode on denormally tiny numbers', () => {
      const result = formatAmountForCount(1e-100, 2, { smartDecimals: true });
      expect(typeof result).toBe('string');
      expect(result.startsWith('0.')).toBe(true);
    });
  });

  describe('integration snippet for percent usage', () => {
    const percent = (v: number) =>
      `${v !== 0 ? '~' : ''}${formatAmountForCount(v, 2, { smartDecimals: true })}%`;

    it('prefixes "~" for non-zero and expands smartly', () => {
      expect(percent(0.0000001)).toBe('~0.0000001%');
      expect(percent(0)).toBe('0.00%');
      expect(percent(1.23)).toBe('~1.23%');
    });
  });

  describe('Fund Status and Pillar checks', () => {
    const fund = {
      status: 'ACTIVE',
      pillar: 2,
      fundManager: { name: 'Tuleva' },
    } as Fund;

    it('checks if a fund is active', () => {
      expect(isActive(fund)).toBe(true);
      expect(isActive({ ...fund, status: 'LIQUIDATED' })).toBe(false);
    });

    it('checks if a fund is second pillar', () => {
      expect(isSecondPillar(fund)).toBe(true);
      expect(isSecondPillar({ ...fund, pillar: 3 })).toBe(false);
    });

    it('checks if a fund is third pillar', () => {
      expect(isThirdPillar({ ...fund, pillar: 3 })).toBe(true);
      expect(isThirdPillar(fund)).toBe(false);
    });

    it('checks if a fund is managed by Tuleva', () => {
      expect(isTuleva(fund)).toBe(true);
      expect(isTuleva({ ...fund, fundManager: { name: 'Other' } })).toBe(false);
    });
  });
});
