import { PensionInput, simulate, TAX_SHORT } from './pension';
import { keepGrowingScenario, lifeTable, rowAt, within } from './testUtils';

const base: PensionInput = {
  birthYear: 1975,
  sex: 'N',
  pensionAgeYears: 65,
  p1Monthly: 1000,
  p2: 0,
  p3: 0,
  p3Before2021: false,
  grossMonthly: 2000,
  p2Rate: 0,
  p3Monthly: 0,
  needMonthly: 1000,
  realReturn: 0,
  depositReturn: 0,
  extraDeposit: 0,
};
const separate = (mode: 'lump' | 'fund'): PensionInput => ({
  ...base,
  p3Sep: { amount: 20000, mode, contract: 'yearly' },
});

describe('III pillar payout started five years before the pension age while working', () => {
  describe('everything at once', () => {
    const depositLoss = -0.01;
    const atOnce = rowAt(
      simulate(
        { ...separate('lump'), p3PayoutFrom: 60, depositReturn: depositLoss },
        lifeTable,
        keepGrowingScenario,
      ),
      65,
    );

    it('empties the III pillar before the pension age', () => {
      expect(atOnce.pot).toBe(0);
    });

    it('keeps the money on the deposit from 60, after 10% income tax', () => {
      expect(atOnce.deposit).toBeCloseTo(
        20000 * (1 - TAX_SHORT) * (1 + depositLoss) ** 5,
        within(1e-6),
      );
    });
  });

  describe('everything at once after retiring early and working on', () => {
    const result = simulate(
      { ...separate('lump'), p3PayoutFrom: 60, soodus: 5, workOn: true, workUntil: 65 },
      lifeTable,
      keepGrowingScenario,
    );

    it('has the money on the deposit from 60', () => {
      expect(rowAt(result, 60).deposit).toBeCloseTo(20000 * (1 - TAX_SHORT), within(1e-6));
    });

    it('pays no fund pension', () => {
      expect(result.rows.filter(({ fp }) => fp > 0)).toEqual([]);
    });
  });

  describe('fund pension', () => {
    const started = rowAt(
      simulate({ ...separate('fund'), p3PayoutFrom: 60 }, lifeTable, keepGrowingScenario),
      65,
    );
    const fromPensionAge = rowAt(simulate(separate('fund'), lifeTable, keepGrowingScenario), 65);

    it('puts the payouts made while working on the deposit', () => {
      expect(started.deposit).toBeGreaterThan(0);
    });

    it('leaves less in the III pillar at the pension age than a fund pension from the pension age', () => {
      expect(started.pot).toBeLessThan(fromPensionAge.pot);
    });

    it('keeps the money, as the payouts move to the deposit', () => {
      expect(started.pot + started.deposit).toBeCloseTo(20000, within(1e-6));
    });
  });

  it('starts no earlier than five years before the pension age for savers who joined in 2021 or later', () => {
    expect(
      simulate({ ...separate('lump'), p3PayoutFrom: 55 }, lifeTable, keepGrowingScenario).rows,
    ).toEqual(
      simulate({ ...separate('lump'), p3PayoutFrom: 60 }, lifeTable, keepGrowingScenario).rows,
    );
  });
});
