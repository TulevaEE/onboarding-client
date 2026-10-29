import { SecondPillarContribution } from '../common/apiModels';
import { AVG_PERSONALIZED_SOCIAL_TAX_PENSION_COMPONENT_EUR_BY_YEAR as AVG_PERSONALIZED } from '../comparison/FirstVsSecondPillarComparison';
import { AASTAHINNE, pensionAge, STATE_PENSION_BASE, workAccrual } from './engine/pension';
import { forecastStatePension } from './statePensionForecast';

const TODAY = new Date('2026-10-15T00:00:00Z');
const STATE_RATE = 0.04;
const EMPLOYEE_RATE = 0.02;
const I_PILLAR_SHARE_OF_GROSS = 0.16;
const MONTHS_IN_YEAR = 12;

const paidFor = (
  year: number,
  month: number,
  gross: number,
  { state = STATE_RATE, employee = EMPLOYEE_RATE } = {},
): SecondPillarContribution => ({
  pillar: 2,
  time: new Date(Date.UTC(year, month + 1, 5)).toISOString(),
  sender: 'Employer',
  amount: gross * (state + employee),
  currency: 'EUR',
  additionalParentalBenefit: 0,
  employeeWithheldPortion: gross * employee,
  socialTaxPortion: gross * state,
  interest: 0,
});

const salaryForMonths = (
  year: number,
  months: number[],
  gross: number,
  rates?: { state?: number; employee?: number },
): SecondPillarContribution[] => months.map((month) => paidFor(year, month, gross, rates));

const ALL_MONTHS = Array.from({ length: MONTHS_IN_YEAR }, (_, month) => month);

const salaryForYear = (
  year: number,
  gross: number,
  rates?: { state?: number; employee?: number },
): SecondPillarContribution[] => salaryForMonths(year, ALL_MONTHS, gross, rates);

const forecastUnits = (contributions: SecondPillarContribution[]) =>
  ((forecastFor(contributions) ?? 0) - STATE_PENSION_BASE) / AASTAHINNE;

const insuranceUnits = (year: number, gross: number, firstPillarShareOfGross: number) =>
  (firstPillarShareOfGross * gross) / averagePersonalizedOf(year);

const averagePersonalizedOf = (year: number) =>
  year < 2018 ? (AVG_PERSONALIZED[2018] * AVERAGE_WAGE[year]) / 1309.75 : AVG_PERSONALIZED[year];

const AVERAGE_WAGE: Record<number, number> = {
  2008: 819.25,
  2009: 781.33,
  2010: 788.42,
  2011: 831.5,
  2014: 1000.08,
};

const forecastFor = (
  contributions: SecondPillarContribution[],
  birthYear = 1990,
  grossMonthly = 0,
) => forecastStatePension({ contributions, birthYear, grossMonthly, today: TODAY });

describe('state pension forecast', () => {
  it('is not made for someone born before 1983, who may have worked before the II pillar', () => {
    expect(forecastFor(salaryForYear(2018, 2000), 1982)).toBeNull();
  });

  it('is not made without II pillar contributions to see the working life in', () => {
    expect(forecastFor([])).toBeNull();
  });

  it('adds a year of insurance part to the base amount, by the salary against the year average', () => {
    const gross = 2000;
    const coefficient = (I_PILLAR_SHARE_OF_GROSS * MONTHS_IN_YEAR * gross) / AVG_PERSONALIZED[2018];

    expect(forecastFor(salaryForYear(2018, gross))).toBeCloseTo(
      STATE_PENSION_BASE + coefficient * AASTAHINNE,
      6,
    );
  });

  it('scales the 2018 average by the Statistics Estonia average wage for the years before', () => {
    const gross = 1000;
    const average2015 = (AVG_PERSONALIZED[2018] * 1061.0) / 1309.75;
    const coefficient = (I_PILLAR_SHARE_OF_GROSS * MONTHS_IN_YEAR * gross) / average2015;

    expect(forecastFor(salaryForYear(2015, gross))).toBeCloseTo(
      STATE_PENSION_BASE + coefficient * AASTAHINNE,
      6,
    );
  });

  it('halves the insurance part with the equal part from 2021, capped for a II pillar saver', () => {
    const gross = 2000;
    const coefficient = (I_PILLAR_SHARE_OF_GROSS * MONTHS_IN_YEAR * gross) / AVG_PERSONALIZED[2023];
    const equalPartForIIPillarSaver = 0.8;

    expect(forecastFor(salaryForYear(2023, gross))).toBeCloseTo(
      STATE_PENSION_BASE + ((coefficient + equalPartForIIPillarSaver) / 2) * AASTAHINNE,
      6,
    );
  });

  it('gives a low salary a smaller equal part, by the minimum wage of the year', () => {
    const gross = 362.5;
    const minimumWage2023 = 725;
    const coefficient = (I_PILLAR_SHARE_OF_GROSS * MONTHS_IN_YEAR * gross) / AVG_PERSONALIZED[2023];
    const equalPart = (0.8 * gross) / minimumWage2023;

    expect(forecastFor(salaryForYear(2023, gross))).toBeCloseTo(
      STATE_PENSION_BASE + ((coefficient + equalPart) / 2) * AASTAHINNE,
      6,
    );
  });

  it('reads the 2011 salary from the state paying 2%, with 18% to the I pillar', () => {
    const contributions = salaryForYear(2011, 1000, { state: 0.02 });

    expect(forecastUnits(contributions)).toBeCloseTo(12 * insuranceUnits(2011, 1000, 0.18), 6);
  });

  it('reads the salary of a saver who kept paying in 2010 from their 2%, with 20% to the I pillar', () => {
    const contributions = salaryForYear(2010, 1000, { state: 0 });

    expect(forecastUnits(contributions)).toBeCloseTo(12 * insuranceUnits(2010, 1000, 0.2), 6);
  });

  it('reads 2014–2017 from the state paying 6% to a saver who kept paying in 2010', () => {
    const contributions = [
      ...salaryForYear(2010, 1000, { state: 0 }),
      ...salaryForYear(2014, 1000, { state: 0.06, employee: 0.03 }),
    ];

    expect(forecastUnits(contributions)).toBeCloseTo(
      12 * insuranceUnits(2010, 1000, 0.2) + 12 * insuranceUnits(2014, 1000, 0.14),
      6,
    );
  });

  it('fills the months the state paid nothing in 2009–2010 with the salary of the year before', () => {
    const contributions = [
      ...salaryForMonths(2008, ALL_MONTHS.slice(5), 1000),
      ...salaryForMonths(2009, ALL_MONTHS.slice(0, 5), 1000),
      ...salaryForYear(2011, 1000, { state: 0.02 }),
    ];
    const pausedMonths2009 = 7;
    const pausedMonths2010 = 12;

    expect(forecastUnits(contributions)).toBeCloseTo(
      7 * insuranceUnits(2008, 1000, 0.16) +
        5 * insuranceUnits(2009, 1000, 0.16) +
        pausedMonths2009 * insuranceUnits(2009, 1000, 0.2) +
        pausedMonths2010 * insuranceUnits(2010, 1000, 0.2) +
        12 * insuranceUnits(2011, 1000, 0.18),
      6,
    );
  });

  it('fills the months a saver paused payments in 2021–2022 with the salary before the pause', () => {
    const minimumWage2021 = 584;
    const contributions = [
      ...salaryForYear(2020, 2000),
      ...salaryForMonths(2022, ALL_MONTHS.slice(8), 2000),
    ];
    const equalUnitsWhenPaused = 1 / 12;
    const equalUnitsWhenPaying = Math.min(0.8, (0.8 * 2000) / minimumWage2021) / 12;
    const pausedYear2021 = 12 * ((insuranceUnits(2021, 2000, 0.2) + equalUnitsWhenPaused) / 2);
    const year2022 =
      8 * ((insuranceUnits(2022, 2000, 0.2) + equalUnitsWhenPaused) / 2) +
      4 * ((insuranceUnits(2022, 2000, 0.16) + equalUnitsWhenPaying) / 2);

    expect(forecastUnits(contributions)).toBeCloseTo(
      12 * insuranceUnits(2020, 2000, 0.16) + pausedYear2021 + year2022,
      6,
    );
  });

  it('fills no pause for a saver whose salary did not come back after it', () => {
    const contributions = salaryForYear(2020, 2000);

    expect(forecastUnits(contributions)).toBeCloseTo(12 * insuranceUnits(2020, 2000, 0.16), 6);
  });

  it('counts a year over with no official average yet like the years ahead', () => {
    const gross = 2000;
    const forecast = forecastStatePension({
      contributions: salaryForYear(2026, gross),
      birthYear: 1990,
      grossMonthly: 0,
      today: new Date('2027-03-01T00:00:00Z'),
    });

    expect(forecast).toBeCloseTo(STATE_PENSION_BASE + workAccrual(gross, true, true), 6);
  });

  it('counts only the years already over, and the rest by the salary until the pension age', () => {
    const birthYear = 1990;
    const gross = 2000;
    const yearsToPensionAge = birthYear + pensionAge(birthYear).years - TODAY.getUTCFullYear();

    expect(forecastFor(salaryForYear(2026, gross), birthYear, gross)).toBeCloseTo(
      STATE_PENSION_BASE + yearsToPensionAge * workAccrual(gross, true, true),
      6,
    );
  });
});
