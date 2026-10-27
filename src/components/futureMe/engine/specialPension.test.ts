import {
  FirstPillarChoice,
  GENERAL_ALLOWANCE,
  INCOME_TAX,
  options,
  PensionInput,
  PENSIONER_ALLOWANCE,
  retirementYears,
  Scenario,
  simulate,
  SimulationResult,
  SimulationRow,
  sustainableNeed,
  workAccrual,
  yearlyContribution,
} from './pension';
import { keepGrowingScenario, lifeTable, rowAt } from './testUtils';

const base: PensionInput = {
  birthYear: 1976,
  sex: 'M',
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
const pensionerMonthlyAllowance = PENSIONER_ALLOWANCE / 12;
const generalMonthlyAllowance = GENERAL_ALLOWANCE / 12;
const retirementAge = retirementYears(base);

const simulateKeepGrowing = (input: PensionInput) =>
  simulate(input, lifeTable, keepGrowingScenario);

const firstPillarOf = (result: SimulationResult) => {
  if (!result.firstPillar) {
    throw new Error('No first pillar comparison');
  }
  return result.firstPillar;
};

const pensionAgeChoiceOf = (result: SimulationResult) => {
  const { atPa } = firstPillarOf(result);
  if (!atPa) {
    throw new Error('No first pillar choice at pension age');
  }
  return atPa;
};

describe('special pension', () => {
  describe('when there is none', () => {
    const scenarios: Scenario[] = [
      { id: 'A', deferral: 0 },
      { id: 'B', deferral: 0 },
      { id: 'C', deferral: 2 },
      { id: 'D', deferral: 0 },
      { id: 'E', deferral: 0 },
    ];
    const income = (result: SimulationResult) =>
      result.rows.map((row) => row.i1 + row.i23 + row.dep);

    it.each(scenarios)(
      'leaves the income unchanged with a zero special pension in scenario $id',
      (scenario) => {
        expect(
          income(simulate({ ...base, spMonthly: 0, spStartAge: 50 }, lifeTable, scenario)),
        ).toEqual(income(simulate(base, lifeTable, scenario)));
      },
    );

    it.each(scenarios)('pays no special pension or its tax in scenario $id', (scenario) => {
      expect(
        simulate(base, lifeTable, scenario).rows.filter(
          (row) => row.isp !== 0 || row.ispg !== 0 || row.taxSp !== 0,
        ),
      ).toEqual([]);
    });
  });

  describe('start age', () => {
    const byDefault = simulateKeepGrowing({ ...base, spMonthly: 1500 });
    const fromFiftyEight = simulateKeepGrowing({ ...base, spMonthly: 1500, spStartAge: 58 });

    it('does not start before the pension age by default', () => {
      expect(rowAt(byDefault, retirementAge - 1).ispg).toBe(0);
    });

    it('starts at the pension age by default', () => {
      expect(rowAt(byDefault, retirementAge).ispg).toBeCloseTo(1500, 6);
    });

    it('does not start before the chosen age', () => {
      expect(rowAt(fromFiftyEight, 57).ispg).toBe(0);
    });

    it.each([58, 60, retirementAge - 1, retirementAge, retirementAge + 10])(
      'is paid from the chosen age on, at age %i',
      (age) => {
        expect(rowAt(fromFiftyEight, age).ispg).toBeCloseTo(1500, 6);
      },
    );

    it('is spent as income before the pension age', () => {
      const row = rowAt(fromFiftyEight, 60);
      expect(row.spend).toBeCloseTo(row.isp, 6);
    });

    it('counts no shortfall before the pension age', () => {
      expect(rowAt(fromFiftyEight, 60).shortfall).toBe(0);
    });

    it('uses the general tax-free allowance before the pension age when not working', () => {
      expect(rowAt(fromFiftyEight, 60).taxSp).toBeCloseTo(
        INCOME_TAX * Math.max(0, 1500 - generalMonthlyAllowance),
        6,
      );
    });

    it('is taxed in full before the pension age while a salary uses the tax-free allowance', () => {
      const working = simulateKeepGrowing({
        ...base,
        grossMonthly: 2000,
        spMonthly: 1500,
        spStartAge: 58,
      });
      expect(rowAt(working, 60).taxSp).toBeCloseTo(INCOME_TAX * 1500, 6);
    });

    it('leaves the pillar assets at pension age unchanged when it starts early', () => {
      expect(rowAt(fromFiftyEight, retirementAge).moneyLeft).toBeCloseTo(
        rowAt(byDefault, retirementAge).moneyLeft,
        6,
      );
    });
  });

  describe('work while receiving it', () => {
    const job: PensionInput = {
      ...base,
      grossMonthly: 2000,
      p2Rate: 0.04,
      p3Monthly: 50,
      spMonthly: 1500,
      spStartAge: 58,
    };
    const working = simulateKeepGrowing({ ...job, spWork: true });
    const notWorking = simulateKeepGrowing({ ...job, spWork: false });

    it('stops II pillar contributions from the start age when not working', () => {
      expect(
        rowAt(working, retirementAge).moneyLeft - rowAt(notWorking, retirementAge).moneyLeft,
      ).toBeCloseTo(2000 * 12 * 0.08 * (retirementAge - 58), 6);
    });

    it('assumes work continues by default', () => {
      expect(simulateKeepGrowing({ ...job }).rows).toEqual(working.rows);
    });

    it('keeps the own III pillar contribution when II pillar contributions stop', () => {
      expect(yearlyContribution({ ...job, spWork: false }, 57)).toBeCloseTo(
        2000 * 12 * 0.08 + 600,
        6,
      );
      expect(yearlyContribution({ ...job, spWork: false }, 58)).toBeCloseTo(600, 6);
    });

    it('contributes as before when no age is given', () => {
      expect(yearlyContribution(job)).toBeCloseTo(2000 * 12 * 0.08 + 600, 6);
    });

    it('gives the special pension the general tax-free allowance when not working', () => {
      expect(rowAt(notWorking, 60).taxSp).toBeCloseTo(
        INCOME_TAX * Math.max(0, 1500 - generalMonthlyAllowance),
        6,
      );
    });

    it('taxes the special pension in full while the salary uses the tax-free allowance', () => {
      expect(rowAt(working, 60).taxSp).toBeCloseTo(INCOME_TAX * 1500, 6);
    });

    describe('at a new salary', () => {
      it('contributes to the II pillar from the new salary from the start age', () => {
        const newPay = simulateKeepGrowing({ ...job, spWork: true, spGross: 1200 });
        expect(
          rowAt(working, retirementAge).moneyLeft - rowAt(newPay, retirementAge).moneyLeft,
        ).toBeCloseTo((2000 - 1200) * 12 * 0.08 * (retirementAge - 58), 6);
      });

      it('contributes from the old salary before the start age and from the new one after it', () => {
        expect(yearlyContribution({ ...job, spGross: 1200 }, 57)).toBeCloseTo(
          2000 * 12 * 0.08 + 600,
          6,
        );
        expect(yearlyContribution({ ...job, spGross: 1200 }, 58)).toBeCloseTo(
          1200 * 12 * 0.08 + 600,
          6,
        );
      });

      it('is ignored when not working', () => {
        expect(simulateKeepGrowing({ ...job, spWork: false, spGross: 1200 }).rows).toEqual(
          notWorking.rows,
        );
      });

      it('changes the II pillar contributions from the start age for a special pension from 40', () => {
        const young: PensionInput = { ...job, birthYear: 1990, spStartAge: 40 };
        const youngRetirementAge = retirementYears(young);
        expect(
          rowAt(simulateKeepGrowing(young), youngRetirementAge).moneyLeft -
            rowAt(simulateKeepGrowing({ ...young, spGross: 1200 }), youngRetirementAge).moneyLeft,
        ).toBeCloseTo(800 * 12 * 0.08 * (youngRetirementAge - 40), 6);
      });
    });

    it('changes nothing without a special pension', () => {
      expect(simulateKeepGrowing({ ...job, spMonthly: 0, spWork: false }).rows).toEqual(
        simulateKeepGrowing({ ...job, spMonthly: 0 }).rows,
      );
    });
  });

  describe.each<{ special: number; oldAge: number; paid: FirstPillarChoice }>([
    { special: 1500, oldAge: 1200, paid: 'special' },
    { special: 800, oldAge: 1200, paid: 'oldAge' },
    { special: 1200, oldAge: 1200, paid: 'special' },
    { special: 1000, oldAge: 0, paid: 'special' },
  ])(
    'at pension age with a special pension of $special and an old-age pension of $oldAge',
    ({ special, oldAge, paid }) => {
      const result = simulateKeepGrowing({
        ...base,
        p1Monthly: oldAge,
        spMonthly: special,
        spStartAge: 55,
      });
      const ages = [retirementAge, retirementAge + 1, 90];
      const grossOf: Record<FirstPillarChoice, (row: SimulationRow) => number> = {
        special: (row) => row.ispg,
        oldAge: (row) => row.i1g,
      };
      const pensionName: Record<FirstPillarChoice, string> = {
        special: 'special',
        oldAge: 'old-age',
      };

      it.each(ages)('pays only one first pillar pension at age %i', (age) => {
        const row = rowAt(result, age);
        expect(Math.min(row.ispg, row.i1g)).toBe(0);
      });

      it.each(ages)('pays the larger of the two at age %i', (age) => {
        const row = rowAt(result, age);
        expect(row.ispg + row.i1g).toBeCloseTo(Math.max(special, oldAge), 6);
      });

      it.each(ages)(
        `pays the ${pensionName[paid]} pension, keeping the special pension when both are equal, at age %i`,
        (age) => {
          expect(grossOf[paid](rowAt(result, age))).toBeCloseTo(Math.max(special, oldAge), 6);
        },
      );

      it.each(ages)('uses one pensioner tax-free allowance at age %i', (age) => {
        const row = rowAt(result, age);
        expect(row.tax1 + row.taxSp).toBeCloseTo(
          INCOME_TAX * Math.max(0, Math.max(special, oldAge) - pensionerMonthlyAllowance),
          6,
        );
      });

      it.each(ages)('pays net as gross minus tax at age %i', (age) => {
        const row = rowAt(result, age);
        expect(row.isp).toBeCloseTo(row.ispg - row.taxSp, 6);
        expect(row.i1).toBeCloseTo(row.i1g - row.tax1, 6);
      });
    },
  );

  describe('first pillar comparison', () => {
    it('compares the special pension with the old-age pension in the summary', () => {
      expect(
        simulateKeepGrowing({ ...base, p1Monthly: 1200, spMonthly: 800, spStartAge: 55 })
          .firstPillar,
      ).toEqual({ special: 800, oldAge: 1200, paid: 'oldAge', larger: 'oldAge', atPa: null });
    });

    it('is absent without a special pension', () => {
      expect(simulateKeepGrowing(base).firstPillar).toBeNull();
    });
  });

  describe.each(['yearly', 'once'])(
    'with a state pension deferral and a %s fund pension contract',
    (contract) => {
      const input: PensionInput = { ...base, p1Monthly: 1200, spMonthly: 800 };
      const deferred = simulate(input, lifeTable, { id: 'C', deferral: 2, contract });

      it('calculates as without a deferral', () => {
        expect(deferred.rows).toEqual(
          simulate(input, lifeTable, { id: 'C', deferral: 0, contract }).rows,
        );
      });

      it('starts the old-age pension at the pension age', () => {
        expect(deferred.p1StartAge).toBe(retirementAge);
      });

      it('pays the old-age pension without the deferral increase', () => {
        expect(rowAt(deferred, retirementAge).i1g).toBeCloseTo(1200, 6);
      });
    },
  );

  describe('options', () => {
    const withoutSpecialPension = options(base);
    const withSpecialPension = options({ ...base, spMonthly: 800 });

    it('leaves the deferral open without a special pension', () => {
      expect(withoutSpecialPension.deferral.open).toBe(true);
    });

    it('locks the deferral with a special pension', () => {
      expect(withSpecialPension.deferral.open).toBe(false);
    });

    it('names the special pension as the reason the deferral is locked', () => {
      expect(withSpecialPension.deferral.reason).toMatch(/eripension/i);
    });

    it('locks the deferral as soon as a special pension is declared, before its amount', () => {
      expect(options({ ...base, spHas: true, spMonthly: 0 }).deferral.open).toBe(false);
    });

    it('leaves the deferral open when no special pension is declared', () => {
      expect(options({ ...base, spHas: false }).deferral.open).toBe(true);
    });

    it('leaves the II pillar options unaffected', () => {
      expect(withSpecialPension.p2).toEqual(withoutSpecialPension.p2);
    });

    it('leaves the III pillar options unaffected', () => {
      expect(withSpecialPension.p3).toEqual(withoutSpecialPension.p3);
    });
  });

  describe('sustainable need', () => {
    it('is higher with a special pension above the old-age pension', () => {
      expect(
        sustainableNeed({ ...base, spMonthly: 1500 }, lifeTable, keepGrowingScenario),
      ).toBeGreaterThan(sustainableNeed(base, lifeTable, keepGrowingScenario));
    });

    it('is not lower when the special pension starts earlier', () => {
      expect(
        sustainableNeed(
          { ...base, spMonthly: 1500, spStartAge: 58 },
          lifeTable,
          keepGrowingScenario,
        ),
      ).toBeGreaterThanOrEqual(
        sustainableNeed({ ...base, spMonthly: 1500 }, lifeTable, keepGrowingScenario),
      );
    });

    it('is unchanged by a special pension below the old-age pension', () => {
      expect(sustainableNeed({ ...base, spMonthly: 800 }, lifeTable, keepGrowingScenario)).toBe(
        sustainableNeed(base, lifeTable, keepGrowingScenario),
      );
    });
  });

  describe('in place of the state old-age pension', () => {
    const asOldAge = simulateKeepGrowing({ ...base, p1Monthly: 1500, spMonthly: 0 });
    const asSpecial = simulateKeepGrowing({ ...base, p1Monthly: 0, spMonthly: 1500 });

    it('pays the same net amount as an old-age pension of the same size', () => {
      expect(rowAt(asSpecial, retirementAge).isp).toBeCloseTo(rowAt(asOldAge, retirementAge).i1, 6);
    });

    it('allows the same spending as an old-age pension of the same size', () => {
      expect(rowAt(asSpecial, retirementAge).spend).toBeCloseTo(
        rowAt(asOldAge, retirementAge).spend,
        6,
      );
    });
  });

  describe('choice at pension age', () => {
    const input: PensionInput = { ...base, p1Monthly: 1200, spMonthly: 800, spStartAge: 55 };
    const choosing = (choice?: FirstPillarChoice) =>
      simulateKeepGrowing({ ...input, firstPillarChoice: choice });

    it('pays only the special pension when it is chosen, even though it is smaller', () => {
      const row = rowAt(choosing('special'), retirementAge);
      expect(row.ispg).toBeCloseTo(800, 6);
      expect(row.i1g).toBe(0);
    });

    it('pays only the old-age pension when it is chosen', () => {
      const row = rowAt(choosing('oldAge'), retirementAge);
      expect(row.i1g).toBeCloseTo(1200, 6);
      expect(row.ispg).toBe(0);
    });

    it('pays the larger pension by default', () => {
      expect(choosing().rows).toEqual(choosing('oldAge').rows);
    });

    it('still reports the old-age pension as the larger one when the special pension is chosen', () => {
      expect(choosing('special').firstPillar?.larger).toBe('oldAge');
    });

    it('gives no better sustainable need for the smaller choice', () => {
      expect(
        sustainableNeed({ ...input, firstPillarChoice: 'special' }, lifeTable, keepGrowingScenario),
      ).toBeLessThanOrEqual(sustainableNeed(input, lifeTable, keepGrowingScenario));
    });
  });

  describe('second choice at pension age after retiring early for children', () => {
    const input: PensionInput = {
      ...base,
      birthYear: 1975,
      sex: 'N',
      p1Monthly: 900,
      grossMonthly: 4000,
      p2Rate: 0.06,
      spMonthly: 1050,
      spStartAge: 50,
      kids: { b2012: 5, earlyUser: 'me', supUser: 'me', inForecast: 'no' },
    };
    const ordinaryRetirementAge = retirementYears(input);
    const idle = simulateKeepGrowing(input);
    const working = simulateKeepGrowing({ ...input, workOn: true });

    it('pays the special pension when it is the larger one at early retirement', () => {
      expect(idle.firstPillar?.paid).toBe('special');
    });

    it('offers no second choice at pension age without work', () => {
      expect(idle.firstPillar?.atPa).toBeNull();
    });

    it('chooses the old-age pension at pension age when work has made it larger', () => {
      expect(pensionAgeChoiceOf(working)).toEqual({
        age: ordinaryRetirementAge,
        oldAge: expect.any(Number),
        paid: 'oldAge',
        larger: 'oldAge',
      });
    });

    it('adds five working years to the old-age pension at pension age', () => {
      expect(pensionAgeChoiceOf(working).oldAge).toBeCloseTo(
        firstPillarOf(working).oldAge + 5 * workAccrual(4000, true, true),
        6,
      );
    });

    it('pays the special pension until the pension age', () => {
      expect(rowAt(working, ordinaryRetirementAge - 1).ispg).toBeGreaterThan(0);
    });

    it('switches from the special pension to the old-age pension at pension age', () => {
      const row = rowAt(working, ordinaryRetirementAge);
      expect(row.ispg).toBe(0);
      expect(row.i1g).toBeCloseTo(pensionAgeChoiceOf(working).oldAge, 6);
    });

    it('keeps the special pension at pension age when it is chosen', () => {
      const keep = simulateKeepGrowing({ ...input, workOn: true, firstPillarChoicePa: 'special' });
      const row = rowAt(keep, ordinaryRetirementAge);
      expect(row.ispg).toBeCloseTo(1050, 6);
      expect(row.i1g).toBe(0);
    });
  });
});
