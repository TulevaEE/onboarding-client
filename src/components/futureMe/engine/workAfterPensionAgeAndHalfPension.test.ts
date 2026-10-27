import { DEFERRAL_INCREASE, PensionInput, retirementYears, simulate, workAccrual } from './pension';
import { lifeTable, rowAt, scenarioD } from './testUtils';

const base: PensionInput = {
  birthYear: 1961,
  sex: 'N',
  p1Monthly: 1065.09,
  p2: 0,
  p3: 38724,
  p3Before2021: true,
  grossMonthly: 2500,
  p2Rate: 0,
  p3Monthly: 500,
  needMonthly: 1000,
  realReturn: 0.02,
  depositReturn: -0.01,
  extraDeposit: 0,
};
const retirementAge = retirementYears(base);
const withSpecialPension: PensionInput = { ...base, spMonthly: 1500, spStartAge: 55 };

const renewYearly = (input: PensionInput) => simulate(input, lifeTable, scenarioD);

const breakEvenAge = (input: PensionInput, deferral: number): number => {
  const now = renewYearly(input).rows;
  const deferred = simulate(input, lifeTable, { id: 'C', deferral, contract: 'yearly' }).rows;
  let cumulativeGain = 0;
  for (let i = 0; i < now.length; i += 1) {
    cumulativeGain += deferred[i].i1 - now[i].i1;
    if (cumulativeGain >= 0 && now[i].age > retirementAge + deferral) {
      return now[i].age;
    }
  }
  throw new Error(`Deferral never breaks even: deferral=${deferral}`);
};

describe('work after the pension age', () => {
  const working = renewYearly({ ...base, workOn: true, workUntil: retirementAge + 2 });
  const workingAges = [retirementAge, retirementAge + 1];
  const afterWork = rowAt(working, retirementAge + 2);

  it.each(workingAges)('lives on the salary without touching the pillars at age %i', (age) => {
    const row = rowAt(working, age);
    expect({ work: row.work, shortfall: row.shortfall, fromPillars: row.i23 }).toEqual({
      work: true,
      shortfall: 0,
      fromPillars: 0,
    });
    expect(row.spend).toBeCloseTo(1000, 6);
  });

  it.each(workingAges)(
    'taxes the whole state pension at 22%, as the salary uses the tax-free allowance, at age %i',
    (age) => {
      const row = rowAt(working, age);
      expect(row.tax1).toBeCloseTo(0.22 * row.i1g, 6);
    },
  );

  it('stops working at the chosen age', () => {
    expect(afterWork.work).toBe(false);
  });

  it('taxes the state pension above the 776 € tax-free allowance after work ends', () => {
    expect(afterWork.tax1).toBeCloseTo(0.22 * Math.max(0, afterWork.i1g - 776), 6);
  });

  it('raises the state pension for each year worked', () => {
    expect(afterWork.i1g - 1065.09).toBeCloseTo(2 * workAccrual(2500, false, false), 6);
  });

  it('works for one year after retiring by default', () => {
    const byDefault = renewYearly({ ...base, workOn: true });
    expect(rowAt(byDefault, retirementAge).work).toBe(true);
    expect(rowAt(byDefault, retirementAge + 1).work).toBe(false);
  });

  it('changes nothing when not working on', () => {
    expect(renewYearly({ ...base, workOn: false }).rows).toEqual(renewYearly(base).rows);
  });

  it('makes a deferral pay off sooner, as only 78% of the pension is lost while working', () => {
    expect(breakEvenAge({ ...base, workOn: true, workUntil: retirementAge + 1 }, 1)).toBeLessThan(
      breakEvenAge(base, 1),
    );
  });

  describe('with a special pension', () => {
    const specialWhileWorking = renewYearly({
      ...withSpecialPension,
      workOn: true,
      workUntil: retirementAge + 2,
    });

    it('works at the pension age', () => {
      expect(rowAt(specialWhileWorking, retirementAge).work).toBe(true);
    });

    it('taxes the whole special pension at 22% while working', () => {
      expect(rowAt(specialWhileWorking, retirementAge).taxSp).toBeCloseTo(0.22 * 1500, 6);
    });

    it('taxes the special pension above the tax-free allowance after work ends', () => {
      expect(rowAt(specialWhileWorking, retirementAge + 2).taxSp).toBeCloseTo(
        0.22 * (1500 - 776),
        6,
      );
    });
  });
});

describe('half state pension', () => {
  const halfYearsCases = [1, 3, 5];
  const halfPensionAges = halfYearsCases.flatMap((halfYears) =>
    Array.from({ length: halfYears }, (_, offset) => ({ halfYears, age: retirementAge + offset })),
  );
  const takingHalf = (halfYears: number) => simulate(base, lifeTable, { id: 'D', half: halfYears });

  it.each(halfPensionAges)(
    'pays half the pension at age $age when taking half for $halfYears years',
    ({ halfYears, age }) => {
      expect(rowAt(takingHalf(halfYears), age).i1g).toBeCloseTo(1065.09 / 2, 6);
    },
  );

  it.each(halfYearsCases)(
    'pays the full pension plus half the deferral increase after %i years of half',
    (halfYears) => {
      expect(rowAt(takingHalf(halfYears), retirementAge + halfYears).i1g).toBeCloseTo(
        1065.09 * (1 + DEFERRAL_INCREASE[halfYears] / 2),
        6,
      );
    },
  );

  it.each(halfYearsCases)(
    'leaves a half pension below the tax-free allowance untaxed when taking half for %i years',
    (halfYears) => {
      expect(rowAt(takingHalf(halfYears), retirementAge).tax1).toBe(0);
    },
  );

  it('raises the pension by half the increase of a full deferral of the same length', () => {
    const fullDeferral = simulate(base, lifeTable, { id: 'C', deferral: 3, contract: 'yearly' });
    expect(rowAt(takingHalf(3), retirementAge + 3).i1g - 1065.09).toBeCloseTo(
      (rowAt(fullDeferral, retirementAge + 3).i1g - 1065.09) / 2,
      6,
    );
  });

  describe('while working', () => {
    const halfWhileWorking = simulate(
      { ...base, workOn: true, workUntil: retirementAge + 1 },
      lifeTable,
      { id: 'D', half: 2 },
    );

    it('taxes the whole half pension at 22% while working', () => {
      expect(rowAt(halfWhileWorking, retirementAge).tax1).toBeCloseTo((0.22 * 1065.09) / 2, 6);
    });

    it('leaves the half pension untaxed after work ends', () => {
      expect(rowAt(halfWhileWorking, retirementAge + 1).tax1).toBe(0);
    });
  });

  it('does not apply with a deferral', () => {
    expect(simulate(base, lifeTable, { id: 'C', deferral: 2, half: 3 }).rows).toEqual(
      simulate(base, lifeTable, { id: 'C', deferral: 2 }).rows,
    );
  });

  it('does not apply with a special pension', () => {
    expect(simulate(withSpecialPension, lifeTable, { id: 'D', half: 2 }).rows).toEqual(
      simulate(withSpecialPension, lifeTable, { id: 'D' }).rows,
    );
  });

  it('does not apply with early retirement', () => {
    const earlyRetirement: PensionInput = { ...base, soodus: 3 };
    expect(simulate(earlyRetirement, lifeTable, { id: 'D', half: 2 }).rows).toEqual(
      simulate(earlyRetirement, lifeTable, { id: 'D' }).rows,
    );
  });
});
