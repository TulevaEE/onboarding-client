import {
  earlyYears,
  GENERAL_ALLOWANCE,
  INCOME_TAX,
  options,
  PENSIONER_ALLOWANCE,
  PensionInput,
  retirementYears,
  Scenario,
  simulate,
  workAccrual,
} from './pension';
import {
  keepGrowingScenario,
  lifeTable,
  rowAt,
  scenarioA,
  scenarioB,
  scenarioD,
} from './testUtils';

const base: PensionInput = {
  birthYear: 1976,
  sex: 'N',
  p1Monthly: 1200,
  p2: 50000,
  p3: 0,
  p3Before2021: true,
  grossMonthly: 0,
  p2Rate: 0,
  p3Monthly: 0,
  needMonthly: 1500,
  realReturn: 0,
  depositReturn: 0,
  extraDeposit: 0,
};
const withJob: PensionInput = { ...base, grossMonthly: 2000, p2Rate: 0.04 };

const pensionAge = retirementYears(base);
const pensionerAllowanceMonthly = PENSIONER_ALLOWANCE / 12;
const generalAllowanceMonthly = GENERAL_ALLOWANCE / 12;
const scenarioIds = ['A', 'B', 'C', 'D', 'E'];
const withoutDeferral = (id: string): Scenario => ({ id, deferral: 0 });
const withDeferralInC = (id: string): Scenario => ({ id, deferral: id === 'C' ? 2 : 0 });

const agesFrom = (from: number, until: number) =>
  Array.from({ length: until - from }, (_, offset) => from + offset);

const valuesByAge = <T>(ages: number[], valueAt: (age: number) => T) =>
  Object.fromEntries(ages.map((age) => [age, valueAt(age)]));

describe('pension on favorable terms', () => {
  it.each(scenarioIds)(
    'changes nothing with zero years of favorable terms in scenario %s',
    (id) => {
      const scenario = withDeferralInC(id);

      expect(simulate({ ...base, soodus: 0 }, lifeTable, scenario).rows).toEqual(
        simulate(base, lifeTable, scenario).rows,
      );
    },
  );

  describe('three years early', () => {
    const threeYearsEarly: PensionInput = { ...base, soodus: 3 };
    const early = simulate(threeYearsEarly, lifeTable, scenarioD);

    it('starts the state pension three years before the ordinary pension age', () => {
      expect(early.p1StartAge).toBe(pensionAge - 3);
    });

    it('starts the retirement with the state pension', () => {
      expect(early.pensionStartAge).toBe(pensionAge - 3);
    });

    it('keeps the ordinary pension age', () => {
      expect(early.ordinaryPensionAge).toBe(pensionAge);
      expect(retirementYears(threeYearsEarly)).toBe(pensionAge);
    });

    it('pays no state pension before it starts', () => {
      expect(rowAt(early, pensionAge - 4).i1g).toBe(0);
    });

    it('pays the state pension in full', () => {
      expect(rowAt(early, pensionAge - 3).i1g).toBeCloseTo(1200, 6);
    });

    it('starts spending when the state pension starts', () => {
      expect(rowAt(early, pensionAge - 3).spend).toBeGreaterThan(0);
      expect(rowAt(early, pensionAge - 4).spend).toBe(0);
    });

    it('taxes the state pension above the 700 € general tax-free income before the ordinary pension age', () => {
      const expectedTax = INCOME_TAX * Math.max(0, 1200 - generalAllowanceMonthly);

      expect(rowAt(early, pensionAge - 3).tax1).toBeCloseTo(expectedTax, 6);
      expect(rowAt(early, pensionAge - 1).tax1).toBeCloseTo(expectedTax, 6);
    });

    it('taxes the state pension above the 776 € pensioner tax-free income from the ordinary pension age', () => {
      expect(rowAt(early, pensionAge).tax1).toBeCloseTo(
        INCOME_TAX * Math.max(0, 1200 - pensionerAllowanceMonthly),
        6,
      );
    });
  });

  describe('ten years early', () => {
    const tenYearsEarly: PensionInput = { ...base, soodus: 10, p3: 0 };
    const lockedAges = agesFrom(pensionAge - 10, pensionAge - 5);

    it.each([
      ['B', scenarioB],
      ['D', scenarioD],
      ['E', keepGrowingScenario],
    ])(
      'keeps the II pillar locked until five years before the ordinary pension age in scenario %s',
      (_, scenario) => {
        const simulation = simulate(tenYearsEarly, lifeTable, scenario);

        expect(valuesByAge(lockedAges, (age) => rowAt(simulation, age).i2)).toEqual(
          valuesByAge(lockedAges, () => 0),
        );
      },
    );

    it.each([
      ['B', scenarioB],
      ['D', scenarioD],
      ['E', keepGrowingScenario],
    ])(
      'opens the II pillar five years before the ordinary pension age in scenario %s',
      (_, scenario) => {
        expect(
          rowAt(simulate(tenYearsEarly, lifeTable, scenario), pensionAge - 5).i2,
        ).toBeGreaterThan(0);
      },
    );

    it('keeps nothing on deposit before the II pillar opens when withdrawing everything at once', () => {
      const simulation = simulate(tenYearsEarly, lifeTable, scenarioA);

      expect(valuesByAge(lockedAges, (age) => rowAt(simulation, age).dep)).toEqual(
        valuesByAge(lockedAges, () => 0),
      );
    });

    it('withdraws everything at once when the II pillar opens', () => {
      expect(
        rowAt(simulate(tenYearsEarly, lifeTable, scenarioA), pensionAge - 5).dep,
      ).toBeGreaterThan(0);
    });

    describe('with a separate III pillar joined in 2021 or later', () => {
      const separateThirdPillar = simulate(
        {
          ...tenYearsEarly,
          p3Sep: { amount: 20000, mode: 'fund', contract: 'yearly' },
          p3Before2021: false,
        },
        lifeTable,
        keepGrowingScenario,
      );

      it('keeps the III pillar locked until 60', () => {
        const ages = agesFrom(pensionAge - 10, 60);

        expect(valuesByAge(ages, (age) => rowAt(separateThirdPillar, age).i3)).toEqual(
          valuesByAge(ages, () => 0),
        );
      });

      it('opens the III pillar at 60', () => {
        expect(rowAt(separateThirdPillar, 60).i3).toBeGreaterThan(0);
      });
    });
  });

  it('opens the II pillar in the same year as the state pension when five years early', () => {
    const fiveYearsEarly = rowAt(
      simulate({ ...base, soodus: 5 }, lifeTable, scenarioD),
      pensionAge - 5,
    );

    expect(fiveYearsEarly.i2).toBeGreaterThan(0);
    expect(fiveYearsEarly.i1g).toBeGreaterThan(0);
  });

  describe('deferring the state pension', () => {
    it('is closed', () => {
      expect(options({ ...base, soodus: 3 }).deferral.open).toBe(false);
    });

    it('names the favorable terms as the reason it is closed', () => {
      expect(options({ ...base, soodus: 3 }).deferral.reason).toMatch(/soodus/i);
    });

    it('stays open without favorable terms', () => {
      expect(options(base).deferral.open).toBe(true);
    });

    it('has no effect on the simulation', () => {
      expect(simulate({ ...base, soodus: 3 }, lifeTable, { id: 'C', deferral: 2 }).rows).toEqual(
        simulate({ ...base, soodus: 3 }, lifeTable, { id: 'C', deferral: 0 }).rows,
      );
    });
  });

  it('stops contributions from salary at the early retirement', () => {
    expect(
      rowAt(simulate({ ...withJob, soodus: 3 }, lifeTable, keepGrowingScenario), pensionAge - 3)
        .moneyLeft,
    ).toBeCloseTo(50000 + 2000 * 12 * 0.08 * (pensionAge - 3 - 50), 6);
  });

  describe('with a special pension', () => {
    const withSpecialPension = simulate(
      { ...base, soodus: 3, spMonthly: 800, spStartAge: 55 },
      lifeTable,
      keepGrowingScenario,
    );

    it('pays the special pension until the state pension starts', () => {
      expect(rowAt(withSpecialPension, pensionAge - 4).ispg).toBeCloseTo(800, 6);
      expect(rowAt(withSpecialPension, pensionAge - 4).i1g).toBe(0);
    });

    it('switches to the larger state pension when it starts', () => {
      expect(rowAt(withSpecialPension, pensionAge - 3).i1g).toBeCloseTo(1200, 6);
      expect(rowAt(withSpecialPension, pensionAge - 3).ispg).toBe(0);
    });
  });

  describe('working on during the early state pension', () => {
    const working: PensionInput = { ...withJob, soodus: 3, soodusWork: true };
    const simulation = simulate(working, lifeTable, scenarioD);
    const accrual = workAccrual(2000, true, true);
    const workingAges = agesFrom(pensionAge - 3, pensionAge);

    it('covers spending from the salary, without a shortfall or II pillar payments', () => {
      expect(
        valuesByAge(workingAges, (age) => {
          const { work, spend, shortfall, i2 } = rowAt(simulation, age);
          return { work, spend, shortfall, i2 };
        }),
      ).toEqual(
        valuesByAge(workingAges, () => ({
          work: true,
          spend: expect.closeTo(1500, 6),
          shortfall: 0,
          i2: 0,
        })),
      );
    });

    it('taxes the whole state pension, since the salary uses the general tax-free income', () => {
      expect(valuesByAge(workingAges, (age) => rowAt(simulation, age).tax1)).toEqual(
        valuesByAge(workingAges, (age) =>
          expect.closeTo(INCOME_TAX * rowAt(simulation, age).i1g, 6),
        ),
      );
    });

    it('raises the state pension back to the forecast with each year worked', () => {
      expect(rowAt(simulation, pensionAge - 3).i1g).toBeCloseTo(1200 - 3 * accrual, 6);
      expect(rowAt(simulation, pensionAge - 2).i1g).toBeCloseTo(1200 - 2 * accrual, 6);
      expect(rowAt(simulation, pensionAge).i1g).toBeCloseTo(1200, 6);
    });

    it('starts the pillar payments when work ends', () => {
      expect(rowAt(simulation, pensionAge).work).toBe(false);
      expect(rowAt(simulation, pensionAge).i2).toBeGreaterThan(0);
    });

    it('holds the contributions and the saved state pension when work ends', () => {
      const savedStatePension = [pensionAge - 3, pensionAge - 2, pensionAge - 1].reduce(
        (total, age) => total + rowAt(simulation, age).i1 * 12,
        0,
      );

      expect(rowAt(simulation, pensionAge).moneyLeft).toBeCloseTo(
        50000 + 2000 * 12 * 0.08 * (pensionAge - 50) + savedStatePension,
        6,
      );
    });

    it('ends work at the chosen age', () => {
      const untilChosenAge = simulate(
        { ...working, workUntil: pensionAge - 2 },
        lifeTable,
        scenarioD,
      );

      expect(rowAt(untilChosenAge, pensionAge - 3).work).toBe(true);
      expect(rowAt(untilChosenAge, pensionAge - 2).work).toBe(false);
      expect(rowAt(untilChosenAge, pensionAge - 2).shortfall).toBe(0);
    });

    it('does not work when working on is not chosen', () => {
      expect(
        simulate({ ...withJob, soodus: 3, soodusWork: false }, lifeTable, scenarioD).rows,
      ).toEqual(simulate({ ...withJob, soodus: 3 }, lifeTable, scenarioD).rows);
    });

    it('changes nothing without favorable terms', () => {
      expect(simulate({ ...withJob, soodusWork: true }, lifeTable, scenarioD).rows).toEqual(
        simulate(withJob, lifeTable, scenarioD).rows,
      );
    });
  });

  describe('contributing to the III pillar after the early retirement', () => {
    const contributing: PensionInput = {
      ...withJob,
      soodus: 3,
      p3Monthly: 100,
      needMonthly: 500,
    };
    const continued = simulate(contributing, lifeTable, keepGrowingScenario);
    const stopped = simulate({ ...contributing, p3After: 0 }, lifeTable, keepGrowingScenario);
    const earlyAges = agesFrom(pensionAge - 3, pensionAge);

    it('covers spending from the state pension whether contributing or not', () => {
      expect(
        valuesByAge(earlyAges, (age) => ({
          continued: rowAt(continued, age).spend,
          stopped: rowAt(stopped, age).spend,
        })),
      ).toEqual(
        valuesByAge(earlyAges, () => ({
          continued: expect.closeTo(500, 6),
          stopped: expect.closeTo(500, 6),
        })),
      );
    });

    it('moves the contribution from the deposit to the III pillar at zero returns', () => {
      expect(rowAt(continued, pensionAge).moneyLeft).toBeCloseTo(
        rowAt(stopped, pensionAge).moneyLeft,
        6,
      );
    });

    it('leaves more money than the deposit at a positive return', () => {
      const atPositiveReturn = { realReturn: 0.02, depositReturn: -0.01 };

      expect(
        rowAt(
          simulate({ ...contributing, ...atPositiveReturn }, lifeTable, keepGrowingScenario),
          pensionAge,
        ).moneyLeft,
      ).toBeGreaterThan(
        rowAt(
          simulate(
            { ...contributing, ...atPositiveReturn, p3After: 0 },
            lifeTable,
            keepGrowingScenario,
          ),
          pensionAge,
        ).moneyLeft,
      );
    });

    it('contributes nothing without a monthly III pillar contribution', () => {
      expect(
        simulate({ ...withJob, soodus: 3, p3Monthly: 0 }, lifeTable, keepGrowingScenario).rows,
      ).toEqual(
        simulate(
          { ...withJob, soodus: 3, p3Monthly: 0, p3After: 0 },
          lifeTable,
          keepGrowingScenario,
        ).rows,
      );
    });
  });

  it.each(scenarioIds)('never has a negative cash flow in scenario %s', (id) => {
    const { rows } = simulate(
      { ...withJob, soodus: 3, realReturn: 0.02 },
      lifeTable,
      withoutDeferral(id),
    );

    expect(
      rows.filter((row) => row.spend < -1e-9 || row.shortfall < -1e-9).map((row) => row.age),
    ).toEqual([]);
  });
});

describe('years of hazardous work for retiring early', () => {
  it('do not allow retiring early with less than 10 years on list 1', () => {
    expect(earlyYears({ kids: {}, hazard: 'list1', hazardYears: 9 })).toBe(0);
  });

  it('allow retiring 10 years early with 10 years on list 1', () => {
    expect(earlyYears({ kids: {}, hazard: 'list1', hazardYears: 10 })).toBe(10);
  });

  it('do not allow retiring early with less than 12.5 years on list 2', () => {
    expect(earlyYears({ kids: {}, hazard: 'list2', hazardYears: 12 })).toBe(0);
  });

  it('allow retiring 5 years early with 12.5 years on list 2', () => {
    expect(earlyYears({ kids: {}, hazard: 'list2', hazardYears: 12.5 })).toBe(5);
  });

  it('are assumed sufficient when unknown', () => {
    expect(earlyYears({ kids: {}, hazard: 'list2' })).toBe(5);
  });
});
