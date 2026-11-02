import { PensionInput, simulate } from './pension';
import { lifeTable, rowAt, scenarioB } from './testUtils';

const saver: PensionInput = {
  birthYear: 1966,
  sex: 'N',
  p1Monthly: 900,
  p2: 150000,
  p3: 0,
  p3Before2021: true,
  p3Sep: { amount: 40000, mode: 'fund', contract: 'once' },
  grossMonthly: 2000,
  p2Rate: 0.02,
  p3Monthly: 0,
  needMonthly: 1300,
  realReturn: 0.04,
  realReturn3: 0.04,
  depositReturn: 0,
  extraDeposit: 0,
};

const withThirdPillarEndAge = (endAge: number): PensionInput => ({
  ...saver,
  p3Sep: { amount: 40000, mode: 'fund', contract: 'once', endAge },
});

describe('one fund pension contract until a chosen age', () => {
  const byAverage = simulate(saver, lifeTable, scenarioB);
  const start = byAverage.fundPensionContracts.second?.start ?? 0;

  it('pays a smaller II pillar amount that lasts until 95', () => {
    const until95 = simulate(saver, lifeTable, { ...scenarioB, endAge: 95 });

    expect(until95.fundPensionContracts.second).toEqual({ start, end: 95 });
    expect(rowAt(until95, start).i2).toBeLessThan(rowAt(byAverage, start).i2);
    expect(rowAt(until95, 94).i2).toBeGreaterThan(0);
    expect(rowAt(until95, 95).i2).toBe(0);
  });

  it('pays a smaller III pillar amount that lasts until 95', () => {
    const until95 = simulate(withThirdPillarEndAge(95), lifeTable, scenarioB);
    const thirdStart = byAverage.fundPensionContracts.third?.start ?? 0;

    expect(until95.fundPensionContracts.third).toEqual({ start: thirdStart, end: 95 });
    expect(rowAt(until95, thirdStart).i3).toBeLessThan(rowAt(byAverage, thirdStart).i3);
    expect(rowAt(until95, 94).i3).toBeGreaterThan(0);
    expect(rowAt(until95, 95).i3).toBe(0);
  });

  it('never shortens the term below the average life expectancy', () => {
    const tooEarly = simulate(withThirdPillarEndAge(start + 1), lifeTable, {
      ...scenarioB,
      endAge: start + 1,
    });

    expect(tooEarly.fundPensionContracts).toEqual(byAverage.fundPensionContracts);
    expect(tooEarly.rows).toEqual(byAverage.rows);
  });
});
