import { formatTableNumber } from './FundTable';

describe('formatTableNumber', () => {
  it('leaves numbers below 10 000 without a thousands separator', () => {
    expect(formatTableNumber(1234)).toBe('1234');
    expect(formatTableNumber(9999.4)).toBe('9999');
    expect(formatTableNumber(833)).toBe('833');
  });

  it('groups thousands with a non-breaking space from 10 000 up', () => {
    expect(formatTableNumber(9999.6)).toBe('10 000');
    expect(formatTableNumber(12345)).toBe('12 345');
  });
});
