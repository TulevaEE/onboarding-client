import { PensionInput, simulate, TAX_SHORT } from './pension';
import { lifeTable, scenarioA, scenarioB, within } from './testUtils';

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
  depositReturn: -0.01,
  extraDeposit: 0,
};
const secondFromSixty: PensionInput = { ...base, p2PayoutFrom: 60 };
const thirdFromSixty: PensionInput = {
  ...base,
  p2: 0,
  p2Rate: 0,
  p3Sep: { amount: 20000, mode: 'lump' },
  p3PayoutFrom: 60,
};

describe('payouts taken before the saver starts living off the money', () => {
  it('has none when the pillars are taken only at the pension age', () => {
    expect(simulate(base, lifeTable, scenarioA).earlyPayouts).toEqual({
      secondPillar: null,
      thirdPillar: null,
    });
  });

  describe('the II pillar taken at once at 60', () => {
    const result = simulate(secondFromSixty, lifeTable, scenarioA);
    const payout = result.earlyPayouts.secondPillar;

    it('says what was in the pillar, the tax and what the saver got', () => {
      expect(payout?.from).toBe(60);
      expect(payout?.tax).toBeCloseTo((payout?.gross ?? 0) * TAX_SHORT, within(1e-6));
      expect(payout?.net).toBeCloseTo((payout?.gross ?? 0) * (1 - TAX_SHORT), within(1e-6));
    });

    it('is worth on the deposit what the bar shows when the money is used', () => {
      expect(payout?.atMoneyUse).toBeCloseTo(result.potAtPension.deposit, within(1e-6));
      expect(payout?.atMoneyUse).toBeLessThan(payout?.net ?? 0);
    });
  });

  describe('the II pillar taken monthly from 60', () => {
    const result = simulate(secondFromSixty, lifeTable, scenarioB);
    const payout = result.earlyPayouts.secondPillar;

    it('gives the first monthly payout and the total until the money is used', () => {
      expect(payout?.from).toBe(60);
      expect(payout?.firstMonthly).toBeGreaterThan(0);
      expect(payout?.net).toBeGreaterThan((payout?.firstMonthly ?? 0) * 12);
    });

    it('is worth on the deposit what the bar shows when the money is used', () => {
      expect(payout?.atMoneyUse).toBeCloseTo(result.potAtPension.deposit, within(1e-6));
    });

    it('counts the payouts made while working past the pension age, until the work ends', () => {
      const working = simulate(
        { ...secondFromSixty, workOn: true, workUntil: 67 },
        lifeTable,
        scenarioB,
      ).earlyPayouts.secondPillar;

      expect(working?.net).toBeGreaterThan(payout?.net ?? 0);
    });
  });

  it('gives the III pillar taken at once at 60 apart from the II pillar', () => {
    const result = simulate(thirdFromSixty, lifeTable, scenarioA);

    expect(result.earlyPayouts.secondPillar).toBeNull();
    expect(result.earlyPayouts.thirdPillar?.from).toBe(60);
    expect(result.earlyPayouts.thirdPillar?.atMoneyUse).toBeCloseTo(
      result.potAtPension.deposit,
      within(1e-6),
    );
  });
});

it('has no early payout when the saver retires at the payout age and does not work on', () => {
  const retiringAtSixty = simulate({ ...secondFromSixty, soodus: 5 }, lifeTable, scenarioA);

  expect(retiringAtSixty.earlyPayouts.secondPillar).toBeNull();
});
