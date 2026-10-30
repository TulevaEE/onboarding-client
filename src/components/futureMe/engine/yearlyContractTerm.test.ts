import { LifeTable, PensionInput, simulate, yearlyContractTerm } from './pension';
import { lifeTable, scenarioD } from './testUtils';

const MONTHS_IN_YEAR = 12;
const FIRST_AGE = 65;
const LAST_AGE = 85;

const ages = Array.from({ length: LAST_AGE - FIRST_AGE + 1 }, (_, index) => FIRST_AGE + index);

const saver: PensionInput = {
  birthYear: 1966,
  sex: 'N',
  p1Monthly: 900,
  p2: 150000,
  p3: 0,
  p3Before2021: true,
  p3Sep: { amount: 40000, mode: 'fund' },
  grossMonthly: 2000,
  p2Rate: 0.02,
  p3Monthly: 0,
  needMonthly: 1300,
  realReturn: 0.04,
  realReturn3: 0.04,
  depositReturn: 0,
  extraDeposit: 0,
};

const directionChanges = (values: number[]): number => {
  const steps = values.slice(1).map((value, index) => Math.sign(Math.round(value - values[index])));
  const moving = steps.filter((step) => step !== 0);
  return moving.slice(1).filter((step, index) => step !== moving[index]).length;
};

describe('fund pension with a new contract every year', () => {
  it('counts the remaining life expectancy in whole months', () => {
    const months = ages.map((age) => yearlyContractTerm(lifeTable, 'N', age) * MONTHS_IN_YEAR);

    expect(months).toEqual(months.map(Math.round));
  });

  it("uses the person's own sex column when the life table has no whole-population column", () => {
    const { M, N } = lifeTable.elada_jaanud;
    const withoutWholePopulation: LifeTable = { ...lifeTable, elada_jaanud: { M, N } };

    expect(yearlyContractTerm(withoutWholePopulation, 'M', 65)).toBe(
      Math.round(MONTHS_IN_YEAR * M[65]) / MONTHS_IN_YEAR,
    );
  });

  it('shortens the term every year', () => {
    const terms = ages.map((age) => yearlyContractTerm(lifeTable, 'N', age));

    expect(terms.slice(1).every((term, index) => term < terms[index])).toBe(true);
  });

  it('pays a II pillar amount that rises and then falls, without zigzag', () => {
    const rows = simulate(saver, lifeTable, scenarioD).rows.filter(
      ({ age }) => age >= FIRST_AGE && age <= LAST_AGE,
    );

    expect(directionChanges(rows.map(({ i2 }) => i2))).toBeLessThanOrEqual(1);
  });

  it('pays a III pillar amount that rises and then falls, without zigzag', () => {
    const rows = simulate(saver, lifeTable, scenarioD).rows.filter(
      ({ age }) => age >= FIRST_AGE && age <= LAST_AGE,
    );

    expect(directionChanges(rows.map(({ i3 }) => i3))).toBeLessThanOrEqual(1);
  });
});
