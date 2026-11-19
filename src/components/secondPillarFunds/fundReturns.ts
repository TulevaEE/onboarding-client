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

const isStaleOn = (navDate: string, valuationDate: string) =>
  navDate < addDays(valuationDate, -STALE_NAV_DAYS);

export const newestCommonNavDate = (latestNavDates: string[]) => {
  const newest = latestNavDates.reduce((latest, date) => (date > latest ? date : latest));
  return latestNavDates
    .filter((date) => !isStaleOn(date, newest))
    .reduce((earliest, date) => (date < earliest ? date : earliest));
};

export const annualizedReturn = (
  series: NavValue[],
  years: number,
  valuationDate: string,
): number | null => {
  const end = lastNavOnOrBefore(series, valuationDate);
  if (!end || isStaleOn(end.date, valuationDate)) {
    return null;
  }
  const periodStart = minusYears(valuationDate, years);
  const start = lastNavOnOrBefore(series, periodStart);
  if (
    !start ||
    start.date < addDays(periodStart, -STARTING_NAV_TOLERANCE_DAYS) ||
    start.date >= end.date
  ) {
    return null;
  }
  return (end.value / start.value) ** (DAYS_IN_YEAR / daysBetween(start.date, end.date)) - 1;
};
