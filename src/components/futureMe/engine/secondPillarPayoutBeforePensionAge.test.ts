import { PensionInput, simulate, TAX_SHORT, yearlyContribution } from './pension';
import {
  keepGrowingScenario,
  lifeTable,
  rowAt,
  scenarioA,
  scenarioB,
  scenarioD,
  within,
} from './testUtils';

const base: PensionInput = {
  birthYear: 1975,
  sex: 'N',
  pensionAgeYears: 65,
  p1Monthly: 1000,
  p2: 50000,
  p3: 0,
  p3Before2021: true,
  grossMonthly: 2000,
  p2Rate: 0.02,
  p3Monthly: 0,
  needMonthly: 1000,
  realReturn: 0,
  depositReturn: 0,
  extraDeposit: 0,
};
const fromSixty: PensionInput = { ...base, p2PayoutFrom: 60 };

const contributionsBetween = (first: number, beforeAge: number) =>
  Array.from({ length: beforeAge - first }, (_, offset) =>
    yearlyContribution(base, first + offset),
  ).reduce((sum, value) => sum + value, 0);

const savedUntilSixty = base.p2 + contributionsBetween(51, 60);

describe('II pillar payout started five years before the pension age while working', () => {
  describe.each([
    ['B', scenarioB],
    ['D', scenarioD],
  ])('fund pension in scenario %s', (_, scenario) => {
    const started = rowAt(simulate(fromSixty, lifeTable, scenario), 65);

    it('puts the payouts made while working on the deposit', () => {
      expect(started.deposit).toBeGreaterThan(0);
    });

    it('leaves less in the II pillar at the pension age than a fund pension from the pension age', () => {
      expect(started.pot).toBeLessThan(rowAt(simulate(base, lifeTable, scenario), 65).pot);
    });

    it('stops the II pillar contributions when the payout starts', () => {
      expect(started.pot + started.deposit).toBeCloseTo(savedUntilSixty, within(1e-6));
    });
  });

  describe('everything at once', () => {
    const atOnce = rowAt(simulate(fromSixty, lifeTable, scenarioA), 65);

    it('empties the II pillar at 60', () => {
      expect(atOnce.pot).toBe(0);
    });

    it('puts the money on the deposit after 10% income tax', () => {
      expect(atOnce.deposit).toBeCloseTo(savedUntilSixty * (1 - TAX_SHORT), within(1e-6));
    });
  });

  describe('everything at once after retiring early and working on', () => {
    const result = simulate(
      { ...fromSixty, soodus: 5, workOn: true, workUntil: 65 },
      lifeTable,
      scenarioA,
    );

    it('has the money on the deposit from 60', () => {
      expect(rowAt(result, 60).deposit).toBeCloseTo(
        savedUntilSixty * (1 - TAX_SHORT),
        within(1e-6),
      );
    });

    it('pays no fund pension', () => {
      expect(result.rows.filter(({ fp }) => fp > 0)).toEqual([]);
    });
  });

  it('starts no earlier than five years before the pension age', () => {
    expect(simulate({ ...base, p2PayoutFrom: 55 }, lifeTable, scenarioD).rows).toEqual(
      simulate(fromSixty, lifeTable, scenarioD).rows,
    );
  });

  it('keeps the II pillar contributions in the comparison that keeps the money growing', () => {
    expect(simulate(fromSixty, lifeTable, keepGrowingScenario).rows).toEqual(
      simulate(base, lifeTable, keepGrowingScenario).rows,
    );
  });
});
