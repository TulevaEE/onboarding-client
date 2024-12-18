import { Fund, FundStatus } from './apiModels';
import {
  findWhere,
  createClamper,
  formatAmountForCurrency,
  isThirdPillar,
  isSecondPillar,
  isActive,
  isTuleva,
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

  describe('formatAmountForCurrency', () => {
    it('gives a fixed number with a euro sign after it', () => {
      expect(formatAmountForCurrency(123.456)).toBe('123.46 €');
      expect(formatAmountForCurrency(0.000456)).toBe('0.00 €');
      expect(formatAmountForCurrency(5)).toBe('5.00 €');
    });

    it('handles no arguments', () => {
      expect(formatAmountForCurrency()).toBe('0.00 €');
    });

    it('has a thousands separator', () => {
      expect(formatAmountForCurrency(12345678.9)).toBe('12 345 678.90 €');
    });

    it('can format with less fractional digits', () => {
      expect(formatAmountForCurrency(12345678.97, 0)).toBe('12 345 679 €');
    });

    it('can format with a plus sign', () => {
      expect(formatAmountForCurrency(12345678.97, 0, { isSigned: true })).toBe('+12 345 679 €');
    });

    it('can format with a minus sign', () => {
      expect(formatAmountForCurrency(-12345678.97, 0, { isSigned: true })).toBe('−12 345 679 €');
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
      expect(isActive({ ...fund, status: FundStatus.LIQUIDATED })).toBe(false);
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
