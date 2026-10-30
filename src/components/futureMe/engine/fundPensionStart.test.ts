import { fundPensionTerm, PensionInput, retirementYears, simulate } from './pension';
import { keepGrowingScenario, lifeTable, rowAt, scenarioB, scenarioD, within } from './testUtils';

const agesBetween = (first: number, beforeAge: number) =>
  Array.from({ length: beforeAge - first }, (_, index) => first + index);

const base: PensionInput = {
  birthYear: 1966,
  sex: 'N',
  p1Monthly: 1200,
  p2: 60000,
  p3: 0,
  p3Before2021: true,
  grossMonthly: 0,
  p2Rate: 0,
  p3Monthly: 0,
  needMonthly: 500,
  realReturn: 0.02,
  depositReturn: 0,
  extraDeposit: 0,
};
const pensionAgeYears = retirementYears(base);
describe('fund pension start after the pension age', () => {
  describe.each([scenarioB, scenarioD])('second pillar in scenario $id', (scenario) => {
    it('starts at the pension age when no start is chosen', () => {
      expect(simulate(base, lifeTable, { ...scenario, fundFrom: undefined }).rows).toEqual(
        simulate(base, lifeTable, scenario).rows,
      );
    });

    it('starts at the pension age when the pension age is chosen', () => {
      expect(simulate(base, lifeTable, { ...scenario, fundFrom: pensionAgeYears }).rows).toEqual(
        simulate(base, lifeTable, scenario).rows,
      );
    });

    it('pays nothing before a start chosen at 70 while the need is covered', () => {
      const from70 = simulate(base, lifeTable, { ...scenario, fundFrom: 70 });
      const ages = agesBetween(pensionAgeYears, 70);

      expect(ages.map((age) => ({ age, i2: rowAt(from70, age).i2 }))).toEqual(
        ages.map((age) => ({ age, i2: 0 })),
      );
    });

    it('starts paying at a start chosen at 70', () => {
      const from70 = simulate(base, lifeTable, { ...scenario, fundFrom: 70 });

      expect(rowAt(from70, 70).i2).toBeGreaterThan(0);
    });

    it('has more money at 70 than a fund pension started at the pension age', () => {
      const from70 = simulate(base, lifeTable, { ...scenario, fundFrom: 70 });
      const fromPensionAge = simulate(base, lifeTable, scenario);

      expect(rowAt(from70, 70).moneyLeft).toBeGreaterThan(rowAt(fromPensionAge, 70).moneyLeft);
    });
  });

  describe('single contract started at 70', () => {
    const from70 = simulate(base, lifeTable, { ...scenarioB, fundFrom: 70 });
    const termFrom70 = fundPensionTerm(lifeTable, 70);

    it('lets the payment follow the fund value', () => {
      expect(rowAt(from70, 71).i2).toBeCloseTo(rowAt(from70, 70).i2 * 1.02, within(1e-6));
    });

    it('counts the term from 70', () => {
      expect(rowAt(from70, 70 + termFrom70 - 1).i2).toBeGreaterThan(0);
      expect(rowAt(from70, 70 + termFrom70).i2).toBe(0);
    });

    it('covers a larger need with extra withdrawals before the contract starts', () => {
      const largerNeed = simulate({ ...base, needMonthly: 1500 }, lifeTable, {
        ...scenarioB,
        fundFrom: 70,
      });

      expect(rowAt(largerNeed, pensionAgeYears).i2).toBeGreaterThan(0);
      expect(rowAt(largerNeed, pensionAgeYears).shortfall).toBe(0);
    });
  });

  describe.each(['once', 'yearly'])(
    'separate third pillar fund pension started at 70 with a %s contract',
    (contract) => {
      const from70 = simulate(
        { ...base, p3Sep: { amount: 30000, mode: 'fund', contract, start: 70 } },
        lifeTable,
        keepGrowingScenario,
      );

      it('pays nothing before 70', () => {
        const ages = agesBetween(pensionAgeYears, 70);

        expect(ages.map((age) => ({ age, i3: rowAt(from70, age).i3 }))).toEqual(
          ages.map((age) => ({ age, i3: 0 })),
        );
      });

      it('starts paying at 70', () => {
        expect(rowAt(from70, 70).i3).toBeGreaterThan(0);
      });
    },
  );

  describe('contracts for the average remaining life', () => {
    const termFrom70 = fundPensionTerm(lifeTable, 70);
    const thirdPillarFrom70 = (contract: string): PensionInput => ({
      ...base,
      p3Sep: { amount: 30000, mode: 'fund', contract, start: 70 },
    });

    it('reports a single second pillar contract from its start to the end of its term', () => {
      expect(
        simulate(base, lifeTable, { ...scenarioB, fundFrom: 70 }).fundPensionContracts,
      ).toEqual({ second: { start: 70, end: 70 + termFrom70 }, third: null });
    });

    it('reports a single third pillar contract from its start to the end of its term', () => {
      expect(
        simulate(thirdPillarFrom70('once'), lifeTable, keepGrowingScenario).fundPensionContracts,
      ).toEqual({ second: null, third: { start: 70, end: 70 + termFrom70 } });
    });

    it('reports no contract for fund pensions signed again every year', () => {
      expect(
        simulate(thirdPillarFrom70('yearly'), lifeTable, { ...scenarioD, fundFrom: 70 })
          .fundPensionContracts,
      ).toEqual({ second: null, third: null });
    });
  });
});
