import { CURRENT_YEAR } from './pension';

describe('the calculation year', () => {
  afterEach(() => jest.useRealTimers());

  it('is the year of the day the page is opened', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2031-05-01T12:00:00Z'));

    jest.isolateModules(() => {
      expect(jest.requireActual<{ CURRENT_YEAR: number }>('./pension').CURRENT_YEAR).toBe(2031);
    });
  });

  it('is 2026 in the Tulevane Mina tests, on 15 October, so their numbers do not move with the day they run', () => {
    expect(CURRENT_YEAR).toBe(2026);
    expect(new Date().toISOString()).toBe('2026-10-15T12:00:00.000Z');
    expect(Date.now()).toBe(new Date('2026-10-15T12:00:00Z').getTime());
  });
});
