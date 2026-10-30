import { PensionInput, Sex, simulate } from './pension';
import { lifeTable, scenarioD } from './testUtils';

const inputFor = (sex: Sex): PensionInput => ({
  birthYear: 1966,
  sex,
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
});

const resultFor = (sex: Sex) => simulate(inputFor(sex), lifeTable, scenarioD);

describe('gender-neutral life expectancy', () => {
  it.each<[Sex]>([['N'], ['X']])('puts the horizon age of sex %s where it is for men', (sex) => {
    expect(resultFor(sex).horizonAge).toBe(resultFor('M').horizonAge);
  });

  it.each<[Sex]>([['N'], ['X']])('gives sex %s the survival odds men get', (sex) => {
    const aliveOf = (rows: ReturnType<typeof resultFor>['rows']) => rows.map((row) => row.alive);

    expect(aliveOf(resultFor(sex).rows)).toEqual(aliveOf(resultFor('M').rows));
  });

  it('takes the horizon age from the whole population column', () => {
    const wholePopulation = lifeTable.ellujaajad.K as number[];
    const currentAge = new Date().getFullYear() - inputFor('M').birthYear;
    const expected = wholePopulation.findIndex(
      (survivors, age) => age >= currentAge && survivors / wholePopulation[currentAge] <= 0.1,
    );

    expect(resultFor('M').horizonAge).toBe(expected);
  });
});
