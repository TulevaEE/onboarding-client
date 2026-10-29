import { Contribution, SecondPillarContribution } from '../common/apiModels';
import { AVG_PERSONALIZED_SOCIAL_TAX_PENSION_COMPONENT_EUR_BY_YEAR as AVG_PERSONALIZED } from '../comparison/FirstVsSecondPillarComparison';
import { AASTAHINNE, pensionAge, STATE_PENSION_BASE, workAccrual } from './engine/pension';

const FIRST_BIRTH_YEAR_WITH_WHOLE_CAREER_IN_II_PILLAR = 1983;
const STATE_RATE = 0.04;
const SOCIAL_TAX_PENSION_PART = 0.2;
const MONTHS_IN_YEAR = 12;
const EQUAL_PART_FROM_YEAR = 2021;
const LAST_YEAR_WITHOUT_OFFICIAL_AVERAGE = 2017;
const WAGE_SCALED_AVERAGE_BASE_YEAR = 2018;

// Statistikaamet PA006, average gross monthly wage, mean of the 12 months
const AVERAGE_WAGE_BY_YEAR: Record<number, number> = {
  2002: 390.42,
  2003: 428.67,
  2004: 460.75,
  2005: 513.17,
  2006: 597.33,
  2007: 720.58,
  2008: 819.25,
  2009: 781.33,
  2010: 788.42,
  2011: 831.5,
  2012: 880.0,
  2013: 947.58,
  2014: 1000.08,
  2015: 1061.0,
  2016: 1138.75,
  2017: 1217.92,
  2018: 1309.75,
};

const MINIMUM_WAGE_BY_YEAR: Record<number, number> = {
  2021: 584,
  2022: 654,
  2023: 725,
  2024: 820,
  2025: 886,
};

interface ForecastInput {
  contributions: Contribution[];
  birthYear: number;
  grossMonthly: number;
  today: Date;
}

// Pensionikeskus: the state paid nothing from 1.06.2009 to 31.12.2010 and 2% in 2011, and 6%
// in 2014–2017 to savers who kept paying their 2% in 2010 (they paid 3%)
const STATE_PAUSE = { from: '2009-06', to: '2010-12' };
const STATE_HALF_RATE_YEAR = 2011;
const STATE_HALF_RATE = 0.02;
const COMPENSATION_YEARS = { from: 2014, to: 2017 };
const COMPENSATION_STATE_RATE = 0.06;
const COMPENSATION_EMPLOYEE_RATE = 0.03;
const EMPLOYEE_RATE = 0.02;
// KoPS: a saver could pause payments from 1.12.2020 to 31.08.2022, the state's 4% then went to the I pillar
const SAVER_PAUSE = { from: '2020-12', to: '2022-08' };
const PAUSE_WINDOWS = [STATE_PAUSE, SAVER_PAUSE];
const MONTHS_BEFORE_PAUSE_FOR_SALARY = 12;

interface SalaryMonth {
  key: string;
  year: number;
  gross: number;
  firstPillarRate: number;
}

const isSecondPillar = (contribution: Contribution): contribution is SecondPillarContribution =>
  contribution.pillar === 2;

const monthKey = (year: number, monthIndex: number): string =>
  new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 7);

const salaryMonthKey = ({ time }: SecondPillarContribution): string => {
  const paid = new Date(time);
  return monthKey(paid.getUTCFullYear(), paid.getUTCMonth() - 1);
};

const yearOf = (key: string): number => Number(key.slice(0, 4));

const isInCompensationYears = (key: string): boolean =>
  yearOf(key) >= COMPENSATION_YEARS.from && yearOf(key) <= COMPENSATION_YEARS.to;

const stateRateOf = (key: string, keptPayingIn2010: boolean): number => {
  if (key >= STATE_PAUSE.from && key <= STATE_PAUSE.to) {
    return 0;
  }
  if (yearOf(key) === STATE_HALF_RATE_YEAR) {
    return STATE_HALF_RATE;
  }
  return keptPayingIn2010 && isInCompensationYears(key) ? COMPENSATION_STATE_RATE : STATE_RATE;
};

const employeeRateOf = (key: string, keptPayingIn2010: boolean): number =>
  keptPayingIn2010 && isInCompensationYears(key) ? COMPENSATION_EMPLOYEE_RATE : EMPLOYEE_RATE;

const sumByMonth = (
  payments: SecondPillarContribution[],
  portion: (payment: SecondPillarContribution) => number,
): Record<string, number> =>
  payments.reduce<Record<string, number>>((byMonth, payment) => {
    const key = salaryMonthKey(payment);
    return { ...byMonth, [key]: (byMonth[key] ?? 0) + portion(payment) };
  }, {});

const paidMonths = (payments: SecondPillarContribution[]): SalaryMonth[] => {
  const stateByMonth = sumByMonth(payments, ({ socialTaxPortion }) => socialTaxPortion);
  const employeeByMonth = sumByMonth(
    payments,
    ({ employeeWithheldPortion }) => employeeWithheldPortion,
  );
  const keptPayingIn2010 = Object.entries(employeeByMonth).some(
    ([key, employee]) => yearOf(key) === yearOf(STATE_PAUSE.to) && employee > 0,
  );
  return Object.keys(stateByMonth).map((key) => {
    const stateRate = stateRateOf(key, keptPayingIn2010);
    const gross =
      stateRate > 0 && stateByMonth[key] > 0
        ? stateByMonth[key] / stateRate
        : employeeByMonth[key] / employeeRateOf(key, keptPayingIn2010);
    return { key, year: yearOf(key), gross, firstPillarRate: SOCIAL_TAX_PENSION_PART - stateRate };
  });
};

const monthNumber = (key: string): number =>
  yearOf(key) * MONTHS_IN_YEAR + Number(key.slice(5)) - 1;

const keyOfMonthNumber = (number: number): string =>
  `${Math.floor(number / MONTHS_IN_YEAR)}-${String((number % MONTHS_IN_YEAR) + 1).padStart(
    2,
    '0',
  )}`;

const monthsBetween = (from: string, to: string): string[] =>
  Array.from({ length: monthNumber(to) - monthNumber(from) + 1 }, (_, index) =>
    keyOfMonthNumber(monthNumber(from) + index),
  );

const pausedMonths = (paid: SalaryMonth[], window: { from: string; to: string }): SalaryMonth[] => {
  const salaryWindowStart = keyOfMonthNumber(
    monthNumber(window.from) - MONTHS_BEFORE_PAUSE_FOR_SALARY,
  );
  const salariesBefore = paid.filter(({ key }) => key >= salaryWindowStart && key < window.from);
  const isPaidAfterPause = paid.some(({ key }) => key > window.to);
  if (salariesBefore.length === 0 || !isPaidAfterPause) {
    return [];
  }
  const gross = salariesBefore.reduce((sum, month) => sum + month.gross, 0) / salariesBefore.length;
  const paidKeys = new Set(paid.map(({ key }) => key));
  return monthsBetween(window.from, window.to)
    .filter((key) => !paidKeys.has(key))
    .map((key) => ({ key, year: yearOf(key), gross, firstPillarRate: SOCIAL_TAX_PENSION_PART }));
};

const salaryMonths = (payments: SecondPillarContribution[]): SalaryMonth[] => {
  const paid = paidMonths(payments);
  return [...paid, ...PAUSE_WINDOWS.flatMap((window) => pausedMonths(paid, window))];
};

const averagePersonalized = (year: number): number =>
  year <= LAST_YEAR_WITHOUT_OFFICIAL_AVERAGE
    ? (AVG_PERSONALIZED[WAGE_SCALED_AVERAGE_BASE_YEAR] * AVERAGE_WAGE_BY_YEAR[year]) /
      AVERAGE_WAGE_BY_YEAR[WAGE_SCALED_AVERAGE_BASE_YEAR]
    : AVG_PERSONALIZED[year];

const insuranceUnits = ({ year, gross, firstPillarRate }: SalaryMonth): number =>
  (gross * firstPillarRate) / averagePersonalized(year);

const equalUnits = ({ year, gross, firstPillarRate }: SalaryMonth): number => {
  const share = firstPillarRate / SOCIAL_TAX_PENSION_PART;
  return Math.min(share, (share * gross) / MINIMUM_WAGE_BY_YEAR[year]) / MONTHS_IN_YEAR;
};

const hasPublishedFigures = (year: number): boolean =>
  averagePersonalized(year) > 0 && (year < EQUAL_PART_FROM_YEAR || year in MINIMUM_WAGE_BY_YEAR);

const unitsOf = (month: SalaryMonth): number => {
  if (!hasPublishedFigures(month.year)) {
    return workAccrual(month.gross, true, true) / AASTAHINNE / MONTHS_IN_YEAR;
  }
  return month.year >= EQUAL_PART_FROM_YEAR
    ? (insuranceUnits(month) + equalUnits(month)) / 2
    : insuranceUnits(month);
};

export const forecastStatePension = ({
  contributions,
  birthYear,
  grossMonthly,
  today,
}: ForecastInput): number | null => {
  const payments = contributions.filter(isSecondPillar);
  if (birthYear < FIRST_BIRTH_YEAR_WITH_WHOLE_CAREER_IN_II_PILLAR || payments.length === 0) {
    return null;
  }
  const currentYear = today.getUTCFullYear();
  const earnedUnits = salaryMonths(payments)
    .filter(({ year }) => year < currentYear)
    .reduce((sum, month) => sum + unitsOf(month), 0);
  const yearsToPensionAge = Math.max(0, birthYear + pensionAge(birthYear).years - currentYear);
  return (
    STATE_PENSION_BASE +
    earnedUnits * AASTAHINNE +
    yearsToPensionAge * workAccrual(grossMonthly, true, true)
  );
};
