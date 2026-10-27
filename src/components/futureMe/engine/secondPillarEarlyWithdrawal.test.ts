import {
  CURRENT_YEAR,
  EarlyWithdrawalResult,
  PensionInput,
  retirementYears,
  simulate,
} from './pension';
import { lifeTable, rowAt, scenarioA } from './testUtils';

const base: PensionInput = {
  birthYear: 1976,
  sex: 'N',
  p1Monthly: 900,
  p2: 30000,
  p3: 0,
  grossMonthly: 2500,
  p2Rate: 0.02,
  needMonthly: 1200,
  realReturn: 0.02,
};
const currentAge = CURRENT_YEAR - base.birthYear;

const simulateAllAtOnce = (input: PensionInput) => simulate(input, lifeTable, scenarioA);

const moneyLeftAt70 = (input: PensionInput) => rowAt(simulateAllAtOnce(input), 70).moneyLeft;

const withdrawalOf = (input: PensionInput): EarlyWithdrawalResult => {
  const { p2Early } = simulateAllAtOnce(input);
  if (!p2Early) {
    throw new Error('No II pillar early withdrawal');
  }
  return p2Early;
};

describe('II pillar early withdrawal', () => {
  const withdrawalToday = withdrawalOf({ ...base, p2Early: { age: currentAge, save: false } });

  it('changes nothing when not chosen', () => {
    expect(simulateAllAtOnce(base).p2Early).toBeNull();
  });

  describe('at the current age', () => {
    it('happens at the chosen age', () => {
      expect(withdrawalToday.age).toBe(currentAge);
    });

    it("withdraws today's II pillar amount", () => {
      expect(Math.abs(withdrawalToday.gross - 30000)).toBeLessThan(1);
    });

    it('withholds 22% income tax', () => {
      expect(withdrawalToday.tax).toBeCloseTo(0.22 * withdrawalToday.gross, 2);
    });

    it('pays out the rest', () => {
      expect(withdrawalToday.net).toBeCloseTo(0.78 * withdrawalToday.gross, 2);
    });
  });

  it('withholds no tax when income tax is off', () => {
    expect(
      simulateAllAtOnce({ ...base, incomeTax: false, p2Early: { age: currentAge } }).p2Early?.tax,
    ).toBe(0);
  });

  it('withdraws a grown amount with the contributions five years later', () => {
    expect(withdrawalOf({ ...base, p2Early: { age: currentAge + 5 } }).gross).toBeGreaterThan(
      withdrawalToday.gross * 1.1,
    );
  });

  describe('money left at 70', () => {
    const withoutWithdrawal = moneyLeftAt70(base);
    const spent = moneyLeftAt70({ ...base, p2Early: { age: currentAge } });
    const saved = moneyLeftAt70({ ...base, p2Early: { age: currentAge, save: true } });

    it('is lower when the withdrawal is spent, as the II pillar is empty and contributions stop', () => {
      expect(spent).toBeLessThan(withoutWithdrawal);
    });

    it('is higher when the withdrawal is saved on a deposit than when spent', () => {
      expect(saved).toBeGreaterThan(spent);
    });

    it('is lower when the withdrawal is saved on a deposit than when left in the II pillar', () => {
      expect(saved).toBeLessThan(withoutWithdrawal);
    });

    it('is higher after rejoining in five years than when spent', () => {
      expect(
        moneyLeftAt70({ ...base, p2Early: { age: currentAge, rejoin: true } }),
      ).toBeGreaterThan(spent);
    });
  });

  it('leaves more money at pension age after rejoining, as the years after rejoining get contributions', () => {
    const pensionAge = retirementYears(base);
    const notRejoining = simulateAllAtOnce({ ...base, p2Early: { age: currentAge } });
    const rejoining = simulateAllAtOnce({ ...base, p2Early: { age: currentAge, rejoin: true } });
    expect(rowAt(rejoining, pensionAge).moneyLeft).toBeGreaterThan(
      rowAt(notRejoining, pensionAge).moneyLeft,
    );
  });

  it('ignores an age in the past', () => {
    expect(simulateAllAtOnce({ ...base, p2Early: { age: currentAge - 1 } }).p2Early).toBeNull();
  });

  it('ignores an age from five years before the pension age on', () => {
    expect(
      simulateAllAtOnce({ ...base, p2Early: { age: retirementYears(base) - 5 } }).p2Early,
    ).toBeNull();
  });

  describe('with a separate III pillar', () => {
    const withThirdPillar: PensionInput = {
      ...base,
      p3: 0,
      p3Monthly: 100,
      p3Sep: { amount: 10000, mode: 'grow' },
    };

    it('keeps the III pillar out of the withdrawal', () => {
      expect(
        withdrawalOf({ ...withThirdPillar, p2Early: { age: currentAge, save: false } }).gross,
      ).toBeLessThan(31000);
    });

    it('keeps III pillar contributions going, which leaves more money for retirement', () => {
      expect(moneyLeftAt70({ ...withThirdPillar, p2Early: { age: currentAge } })).toBeGreaterThan(
        moneyLeftAt70({ ...base, p2Early: { age: currentAge } }),
      );
    });
  });
});
