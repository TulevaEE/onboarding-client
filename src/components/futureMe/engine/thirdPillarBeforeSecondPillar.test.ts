import { PensionInput, simulate } from './pension';
import { keepGrowingScenario, lifeTable, rowAt } from './testUtils';

const base: PensionInput = {
  birthYear: 1975,
  sex: 'N',
  pensionAgeYears: 65,
  p1Monthly: 1000,
  p2: 20000,
  p3: 0,
  p3Before2021: false,
  grossMonthly: 2000,
  p2Rate: 0,
  p3Monthly: 0,
  needMonthly: 1500,
  realReturn: 0,
  depositReturn: 0,
  extraDeposit: 0,
  p3Sep: { amount: 20000, mode: 'grow' },
};

const thirdPillarTaken = (age: number) => {
  const row = rowAt(simulate(base, lifeTable, keepGrowingScenario), age);
  return row.extra - row.extra2;
};
const secondPillarTaken = (age: number) =>
  rowAt(simulate(base, lifeTable, keepGrowingScenario), age).extra2;

describe('what is taken out when the pension does not cover the costs', () => {
  it('takes the III pillar first', () => {
    expect(thirdPillarTaken(65)).toBeGreaterThan(0);
    expect(secondPillarTaken(65)).toBe(0);
  });

  it('takes the II pillar only in the year the III pillar runs out and after it', () => {
    const years = Array.from({ length: 35 }, (_, offset) => 65 + offset);
    const firstSecondPillarYear = years.find((age) => secondPillarTaken(age) > 0) ?? 0;
    const result = simulate(base, lifeTable, keepGrowingScenario);

    expect(firstSecondPillarYear).toBeGreaterThan(65);
    expect(rowAt(result, firstSecondPillarYear + 1).pot3).toBeCloseTo(0, 0);
  });
});
