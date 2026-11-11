import { annualizedReturn } from './fundReturns';

const nav = (date: string, value: number) => ({ date, value });

describe('annualizedReturn', () => {
  test('annualizes the NAV change from the start of the period to the newest NAV', () => {
    const series = [nav('2021-07-13', 1), nav('2026-07-13', 2)];

    expect(annualizedReturn(series, 5, '2026-07-13')).toBeCloseTo(2 ** (365.25 / 1826) - 1, 10);
  });

  test('starts from the last NAV on or before the start of the period', () => {
    const series = [nav('2021-07-09', 1), nav('2021-07-14', 1.5), nav('2026-07-13', 2)];

    expect(annualizedReturn(series, 5, '2026-07-13')).toBeCloseTo(2 ** (365.25 / 1830) - 1, 10);
  });

  test('accepts a starting NAV up to 14 days before the start of the period', () => {
    const series = [nav('2021-06-29', 1), nav('2026-07-13', 2)];

    expect(annualizedReturn(series, 5, '2026-07-13')).not.toBeNull();
  });

  test('has no return when the closest starting NAV is more than 14 days before the period', () => {
    const series = [nav('2021-06-28', 1), nav('2026-07-13', 2)];

    expect(annualizedReturn(series, 5, '2026-07-13')).toBeNull();
  });

  test('has no return when the fund is younger than the period', () => {
    const series = [nav('2023-01-02', 1), nav('2026-07-13', 2)];

    expect(annualizedReturn(series, 5, '2026-07-13')).toBeNull();
  });

  test('has no return when the newest NAV of the fund is more than a week older than the valuation date', () => {
    const series = [nav('2021-07-01', 1), nav('2026-07-05', 2)];

    expect(annualizedReturn(series, 5, '2026-07-13')).toBeNull();
  });
});
