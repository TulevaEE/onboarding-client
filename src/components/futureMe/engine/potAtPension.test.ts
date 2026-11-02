import { PensionInput, simulate } from './pension';
import { keepGrowingScenario, lifeTable, rowAt, scenarioA } from './testUtils';

const input: PensionInput = {
  birthYear: 1975,
  sex: 'N',
  pensionAgeYears: 65,
  p1Monthly: 1000,
  p2: 50000,
  p3: 0,
  p3Sep: { amount: 20000, mode: 'grow' },
  p3Before2021: true,
  grossMonthly: 2000,
  p2Rate: 0.02,
  p3Monthly: 100,
  needMonthly: 1000,
  realReturn: 0,
  depositReturn: 0,
  extraDeposit: 0,
};

describe('pot at the pension age', () => {
  it('splits the pillars money at the pension age into the II and the III pillar', () => {
    const result = simulate(input, lifeTable, keepGrowingScenario);
    const { potAtPension } = result;

    expect(potAtPension.age).toBe(result.pensionStartAge);
    expect(potAtPension.p2).toBeGreaterThan(50000);
    expect(potAtPension.p3).toBeGreaterThan(20000);
    expect(potAtPension.p2 + potAtPension.p3).toBeCloseTo(rowAt(result, potAtPension.age).pot, 6);
  });

  it('has nothing on the deposit while the pillars keep growing', () => {
    const { potAtPension } = simulate(input, lifeTable, keepGrowingScenario);

    expect(potAtPension.deposit).toBe(0);
  });

  it('moves the II pillar to the deposit when it is taken out at once, and leaves the III pillar', () => {
    const { potAtPension } = simulate(input, lifeTable, scenarioA);

    expect(potAtPension.p2).toBe(0);
    expect(potAtPension.p3).toBeGreaterThan(20000);
    expect(potAtPension.deposit).toBeGreaterThan(40000);
  });
});

describe('pot when the saver starts living off the money', () => {
  it('is taken at the age the work ends, when the saver works past the pension age', () => {
    const result = simulate(
      { ...input, workOn: true, workUntil: 74 },
      lifeTable,
      keepGrowingScenario,
    );

    expect(result.potAtPension.age).toBe(74);
    expect(result.potAtPension.p2 + result.potAtPension.p3).toBeCloseTo(rowAt(result, 74).pot, 6);
    expect(result.potAtPension.deposit).toBeCloseTo(rowAt(result, 74).deposit, 6);
  });

  it('holds the state pension saved on the deposit while working', () => {
    const { potAtPension } = simulate(
      { ...input, workOn: true, workUntil: 74 },
      lifeTable,
      keepGrowingScenario,
    );

    expect(potAtPension.deposit).toBeGreaterThan(0);
  });

  it('stays at the pension age when the saver does not work on', () => {
    const result = simulate(input, lifeTable, keepGrowingScenario);

    expect(result.potAtPension.age).toBe(result.pensionStartAge);
  });
});
