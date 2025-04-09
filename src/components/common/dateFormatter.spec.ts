import moment from 'moment';
import { formatDateRange, formatDateYear } from './dateFormatter';

describe('DateFormatter functions', () => {
  describe('English locale', () => {
    beforeAll(() => {
      moment.locale('en');
    });

    describe('formatDateRange', () => {
      it('should format correctly for dates within the same month', () => {
        const firstDateString = '2024-01-01T15:00:00+02:00';
        const secondDateString = '2024-01-10T15:00:00+02:00';
        expect(formatDateRange(firstDateString, secondDateString)).toBe('January 1–10');
      });

      it('should format correctly for dates with different months', () => {
        const firstDateString = '2024-01-01T15:00:00+02:00';
        const secondDateString = '2024-02-15T15:00:00+02:00';
        expect(formatDateRange(firstDateString, secondDateString)).toBe('January 1 – February 15');
      });
    });

    describe('formatDateYear', () => {
      it('should format correctly for a full date with year', () => {
        const dateString = '2024-01-21T15:00:00+02:00';
        expect(formatDateYear(dateString)).toBe('January 21, 2024');
      });
    });
  });

  describe('Estonian locale', () => {
    beforeAll(() => {
      moment.locale('et');
    });

    describe('formatDateRange', () => {
      it('should format correctly for dates within the same month', () => {
        const firstDateString = '2024-01-01T15:00:00+02:00';
        const secondDateString = '2024-01-10T15:00:00+02:00';
        expect(formatDateRange(firstDateString, secondDateString)).toBe('1.–10. jaanuar');
      });

      it('should format correctly for dates with different months', () => {
        const firstDateString = '2024-01-01T15:00:00+02:00';
        const secondDateString = '2024-02-15T15:00:00+02:00';
        expect(formatDateRange(firstDateString, secondDateString)).toBe(
          '1. jaanuar – 15. veebruar',
        );
      });
    });

    describe('formatDateYear', () => {
      it('should format correctly for a full date with year', () => {
        const dateString = '2024-01-21T15:00:00+02:00';
        expect(formatDateYear(dateString)).toBe('21. jaanuar 2024');
      });
    });
  });
});
