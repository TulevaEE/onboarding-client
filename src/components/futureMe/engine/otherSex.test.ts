import { fundPensionTerm, LifeTable, PensionInput, Sex, simulate, survival } from './pension';
import { lifeTable, scenarioD } from './testUtils';

const base: PensionInput = {
  birthYear: 1966,
  sex: 'N',
  p1Monthly: 900,
  p2: 30000,
  p3: 0,
  p3Before2021: true,
  grossMonthly: 0,
  p2Rate: 0.02,
  p3Monthly: 0,
  needMonthly: 1200,
  realReturn: 0,
  depositReturn: 0,
  extraDeposit: 0,
};

const wholePopulation = (key: keyof LifeTable): number[] => {
  const column = lifeTable[key].K;
  if (!column) {
    throw new Error(`No whole population column: key=${key}`);
  }
  return column;
};

const horizonAgeOf = (sex: Sex) => simulate({ ...base, sex }, lifeTable, scenarioD).horizonAge;

describe('sex other', () => {
  it('takes the fund pension term from the whole population column', () => {
    expect(fundPensionTerm(lifeTable, 'X', 65)).toBe(
      Math.round(wholePopulation('elada_jaanud')[65]),
    );
  });

  it('takes survival from the whole population column', () => {
    expect(survival(lifeTable, 'X', 65, 81)).toBeCloseTo(
      wholePopulation('ellujaajad')[81] / wholePopulation('ellujaajad')[65],
      12,
    );
  });

  it('places the horizon no earlier than for men', () => {
    expect(horizonAgeOf('X')).toBeGreaterThanOrEqual(horizonAgeOf('M'));
  });

  it('places the horizon no later than for women', () => {
    expect(horizonAgeOf('X')).toBeLessThanOrEqual(horizonAgeOf('N'));
  });
});
