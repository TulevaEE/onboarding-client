import { formatDateRange } from './dateFormatter';

describe('formatDateRange', () => {
  it('should format correctly for dates within same month', () => {
    const firstDateString = '2024-01-01T15:00:00+02:00';
    const secondDateString = '2024-01-10T15:00:00+02:00';

    expect(formatDateRange(firstDateString, secondDateString)).toBe('1 - 10 January');
  });

  it('should format correctly for dates with different months', () => {
    const firstDateString = '2024-01-01T15:00:00+02:00';
    const secondDateString = '2024-02-15T15:00:00+02:00';

    expect(formatDateRange(firstDateString, secondDateString)).toBe('January 1 - February 15');
  });
});
