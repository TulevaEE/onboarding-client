import { NavValue } from '../common/apiModels';

const STARTING_NAV_TOLERANCE_DAYS = 14;
const STALE_NAV_DAYS = 7;
const DAYS_IN_YEAR = 365.25;
const MILLISECONDS_IN_DAY = 86400000;

const parseDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

export const addDays = (isoDate: string, days: number) => {
  const date = parseDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const minusYears = (isoDate: string, years: number) => {
  const date = parseDate(isoDate);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
};

export const daysBetween = (from: string, to: string) =>
  (parseDate(to).getTime() - parseDate(from).getTime()) / MILLISECONDS_IN_DAY;

const lastNavOnOrBefore = (series: NavValue[], date: string) =>
  [...series].reverse().find((nav) => nav.date <= date);

export const annualizedReturn = (
  series: NavValue[],
  years: number,
  valuationDate: string,
): number | null => {
  const latest = series[series.length - 1];
  if (!latest || latest.date < addDays(valuationDate, -STALE_NAV_DAYS)) {
    return null;
  }
  const periodStart = minusYears(valuationDate, years);
  const start = lastNavOnOrBefore(series, periodStart);
  if (
    !start ||
    start.date < addDays(periodStart, -STARTING_NAV_TOLERANCE_DAYS) ||
    start.date >= latest.date
  ) {
    return null;
  }
  return (latest.value / start.value) ** (DAYS_IN_YEAR / daysBetween(start.date, latest.date)) - 1;
};
