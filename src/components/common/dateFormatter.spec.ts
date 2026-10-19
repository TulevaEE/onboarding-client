import moment from 'moment';
import {
  formatDateFrom,
  formatDateOn,
  formatDateOnWithYear,
  formatDateRange,
  formatDateUntil,
  formatDateYear,
  timeInTallinn,
  todayInTallinn,
} from './dateFormatter';

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

  describe('season deadline forms', () => {
    it('inflects the Estonian month for "from" and "until"', () => {
      moment.locale('et');

      expect(formatDateFrom('2027-01-01')).toBe('1.\u00a0jaanuarist');
      expect(formatDateOn('2026-11-30')).toBe('30.\u00a0novembril');
      expect(formatDateUntil('2026-11-30')).toBe('30.\u00a0novembrini');
      expect(formatDateUntil('2026-05-31')).toBe('31.\u00a0maini');
    });

    it('inflects the Estonian month for "on" and keeps the year with the day', () => {
      moment.locale('et');

      expect(formatDateOnWithYear('2027-11-01')).toBe('1.\u00a0novembril\u00a02027');
      expect(formatDateOnWithYear('2027-05-31')).toBe('31.\u00a0mail\u00a02027');
      expect(formatDateOnWithYear('2026-12-31T22:30:00Z')).toBe('1.\u00a0jaanuaril\u00a02027');
    });

    it('keeps the date with its year in English', () => {
      moment.locale('en');

      expect(formatDateOnWithYear('2027-11-01')).toBe('November\u00a01,\u00a02027');
    });

    it('keeps the plain date in English', () => {
      moment.locale('en');

      expect(formatDateFrom('2027-01-01')).toBe('January\u00a01');
      expect(formatDateOn('2026-11-30')).toBe('November\u00a030');
      expect(formatDateUntil('2026-11-30')).toBe('November\u00a030');
    });

    it('reads an instant as the calendar day it falls on in Estonia', () => {
      moment.locale('et');

      expect(formatDateOn('2026-11-30T21:59:59.999999999Z')).toBe('30.\u00a0novembril');
      expect(formatDateOn('2026-11-30T22:30:00Z')).toBe('1.\u00a0detsembril');
      expect(formatDateUntil('2026-11-30T22:30:00Z')).toBe('1.\u00a0detsembrini');
      expect(formatDateFrom('2026-12-31T22:30:00Z')).toBe('1.\u00a0jaanuarist');
    });
  });

  describe('timeInTallinn', () => {
    it('reads an instant as the clock time in Estonia', () => {
      expect(timeInTallinn('2026-02-03T11:30:00Z')).toBe('13:30');
      expect(timeInTallinn('2026-07-03T11:30:00Z')).toBe('14:30');
      expect(timeInTallinn('2026-02-03T22:30:00Z')).toBe('00:30');
    });
  });

  describe('todayInTallinn', () => {
    afterEach(() => jest.restoreAllMocks());

    it('is the calendar day in Estonia, which starts before the day in UTC', () => {
      jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-02-03T21:59:59Z'));
      expect(todayInTallinn()).toBe('2026-02-03');

      jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-02-03T22:00:00Z'));
      expect(todayInTallinn()).toBe('2026-02-04');

      jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-07-03T21:00:00Z'));
      expect(todayInTallinn()).toBe('2026-07-04');
    });
  });
});
