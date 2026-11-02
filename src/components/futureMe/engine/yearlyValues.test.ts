import {
  AASTAHINNE,
  AVG_OLD_AGE_PENSION,
  GENERAL_ALLOWANCE,
  INCOME_TAX,
  missingYearlyValues,
  PENSIONER_ALLOWANCE,
  valueIn,
} from './pension';

const TAX_VALUES = ['INCOME_TAX', 'GENERAL_ALLOWANCE', 'PENSIONER_ALLOWANCE'];
const INDEXED_VALUES = ['AASTAHINNE', 'AVG_OLD_AGE_PENSION', 'MIN_WAGE'];

describe('yearly values', () => {
  it('take the row of the year, or the latest known year before it', () => {
    const table = { 2026: 1, 2028: 3 };

    expect(valueIn(table, 2026)).toBe(1);
    expect(valueIn(table, 2027)).toBe(1);
    expect(valueIn(table, 2030)).toBe(3);
    expect(valueIn(table, 2020)).toBe(1);
  });

  it('are the 2026 values in 2026', () => {
    expect({
      INCOME_TAX,
      GENERAL_ALLOWANCE,
      PENSIONER_ALLOWANCE,
      AASTAHINNE,
      AVG_OLD_AGE_PENSION,
    }).toEqual({
      INCOME_TAX: 0.22,
      GENERAL_ALLOWANCE: 700 * 12,
      PENSIONER_ALLOWANCE: 776 * 12,
      AASTAHINNE: 10.477,
      AVG_OLD_AGE_PENSION: 860.23,
    });
  });

  it('miss nothing in 2026', () => {
    expect(missingYearlyValues(new Date('2026-10-15T12:00:00Z'))).toEqual([]);
  });

  it('miss the tax values from January of a year without them, and the indexed values from April', () => {
    expect(missingYearlyValues(new Date('2027-02-01T12:00:00Z'))).toEqual(TAX_VALUES);
    expect(missingYearlyValues(new Date('2027-04-01T12:00:00Z'))).toEqual([
      ...TAX_VALUES,
      ...INDEXED_VALUES,
    ]);
  });
});
